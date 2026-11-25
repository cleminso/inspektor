import type { ColumnDescriptor, ColumnType, Value } from 'jazz-tools'

/** Raw text survives mode changes, validation, and live-row replacement. */
export type FieldIntent =
  | { readonly mode: 'value'; readonly text: string }
  | { readonly mode: 'null'; readonly text: string }
  | { readonly mode: 'omitted'; readonly text: string }

export type DraftValues = Readonly<Record<string, unknown>>

function ownValue<T>(record: Readonly<Record<string, T>>, name: string): T | undefined {
  return Object.hasOwn(record, name) === true ? record[name] : undefined
}

export type RowDraft =
  | {
      readonly kind: 'insert'
      readonly sourceValues: DraftValues
      readonly fieldInputs: Readonly<Record<string, FieldIntent>>
    }
  | {
      readonly kind: 'update'
      readonly sourceValues: DraftValues
      /** Only dirty fields are present. */
      readonly fieldInputs: Readonly<Record<string, FieldIntent>>
    }

export type FieldResolution =
  | { readonly kind: 'omitted' }
  | { readonly kind: 'valid'; readonly value: unknown }
  | { readonly kind: 'invalid'; readonly text: string; readonly error: string }

export type DraftSubmission =
  | {
      readonly kind: 'ready'
      /** Semantic values for presentation; JSON is still decoded. */
      readonly values: DraftValues
      /** Pass to the Jazz table mutation, not directly to a storage driver. */
      readonly payload: DraftValues
    }
  | { readonly kind: 'invalid'; readonly errors: Readonly<Record<string, string>> }

export type DraftEdit =
  | { readonly kind: 'changed'; readonly draft: RowDraft }
  | { readonly kind: 'rejected'; readonly field: string; readonly error: string }

export function fieldReadOnlyReason(column: ColumnDescriptor): 'automatic' | 'binary' | null {
  // Jazz reserves $ names for runtime fields. This is a UI restriction, not permission advice.
  if (column.name === 'id' || column.name.startsWith('$') === true) return 'automatic'
  return containsBinary(column.column_type) === true ? 'binary' : null
}

function containsBinary(type: ColumnType): boolean {
  switch (type.type) {
    case 'Bytea':
      return true
    case 'Array':
      return containsBinary(type.element)
    case 'Row':
      return type.columns.some((column) => containsBinary(column.column_type))
    default:
      return false
  }
}

export function formatFieldValue(value: unknown, type: ColumnType): string {
  if (value === undefined || value === null) return ''
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Uint8Array) return `(${value.length} bytes)`
  if (type.type === 'Json' || type.type === 'Row' || type.type === 'Array') {
    try {
      return (
        JSON.stringify(
          value,
          (_key, member: unknown) => (typeof member === 'bigint' ? String(member) : member),
          2,
        ) ?? ''
      )
    } catch {
      try {
        return String(value)
      } catch {
        return ''
      }
    }
  }
  return String(value)
}

function valueIntent(value: unknown, type: ColumnType): FieldIntent {
  return { mode: value === null ? 'null' : 'value', text: formatFieldValue(value, type) }
}

/** Only renders stored defaults for preview. It never supplies a mutation value or evaluates a default. */
function defaultPreviewValue(value: Value, type: ColumnType): unknown {
  switch (value.type) {
    case 'Null':
      return null
    case 'Array':
      if (type.type !== 'Array') throw new Error('Default does not match its array descriptor.')
      return value.value.map((member) => defaultPreviewValue(member, type.element))
    case 'Row':
      throw new Error('Jazz does not expose Row defaults through the stored schema loader.')
    default:
      return type.type === 'Json' ? JSON.parse(String(value.value)) : value.value
  }
}

export function formatColumnDefault(column: ColumnDescriptor): string {
  if (column.default === undefined) return ''
  try {
    return formatFieldValue(
      defaultPreviewValue(column.default, column.column_type),
      column.column_type,
    )
  } catch {
    return ''
  }
}

export function setIntentMode(
  input: FieldIntent,
  column: ColumnDescriptor,
  mode: FieldIntent['mode'],
): FieldIntent {
  const type = column.column_type.type
  const text =
    mode === 'value' && input.text.length === 0
      ? type === 'Array'
        ? '[]'
        : type === 'Json' || type === 'Row'
          ? '{}'
          : input.text
      : input.text
  return { mode, text }
}

export function setIntentText(input: FieldIntent, text: string): FieldIntent {
  return input.mode === 'value' ? { ...input, text } : input
}

/** Defaults stay omitted; no default is evaluated here. @lat: [[rowChanges#Field intent]] */
export function insertDraft(
  columns: readonly ColumnDescriptor[],
  supplied: DraftValues = {},
): RowDraft {
  const fieldInputs = Object.fromEntries(
    columns
      .filter((column) => fieldReadOnlyReason(column) !== 'automatic')
      .map((column): [string, FieldIntent] => {
        if (Object.hasOwn(supplied, column.name) && supplied[column.name] !== undefined) {
          return [column.name, valueIntent(supplied[column.name], column.column_type)]
        }
        if (column.default !== undefined)
          return [column.name, { mode: 'omitted', text: formatColumnDefault(column) }]
        return [column.name, { mode: column.nullable === true ? 'null' : 'value', text: '' }]
      }),
  )
  const sourceValues = Object.fromEntries(
    columns
      .filter(
        (column) =>
          fieldReadOnlyReason(column) !== 'automatic' && Object.hasOwn(supplied, column.name),
      )
      .map((column) => [column.name, supplied[column.name]]),
  )
  return { kind: 'insert', sourceValues, fieldInputs }
}

export function updateDraft(source: DraftValues): RowDraft {
  return { kind: 'update', sourceValues: source, fieldInputs: {} }
}

/** Duplication omits automatic fields. Native binary values can be copied but never text-edited. */
export function duplicateDraft(
  columns: readonly ColumnDescriptor[],
  source: DraftValues,
): RowDraft {
  return insertDraft(columns, source)
}

export function fieldIntent(draft: RowDraft, column: ColumnDescriptor): FieldIntent {
  return (
    ownValue(draft.fieldInputs, column.name) ??
    (draft.kind === 'insert' &&
    column.default !== undefined &&
    ownValue(draft.sourceValues, column.name) === undefined
      ? { mode: 'omitted', text: formatColumnDefault(column) }
      : valueIntent(ownValue(draft.sourceValues, column.name), column.column_type))
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Array.isArray(value) === false
}

function timestamp(value: unknown): number {
  if (value instanceof Date) value = value.getTime()
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new Error('Expected milliseconds or an ISO timestamp.')
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    throw new Error('Timestamp is required.')
  }
  const numeric = Number(value)
  const parsed = Number.isFinite(numeric) === true ? numeric : Date.parse(String(value))
  const result = new Date(parsed).getTime()
  if (Number.isFinite(result) === false)
    throw new Error('Expected milliseconds or an ISO timestamp.')
  return result
}

/** UI constraints only. Jazz remains the schema and mutation encoding authority. */
function normalize(type: ColumnType, value: unknown): unknown {
  switch (type.type) {
    case 'Text':
      if (typeof value !== 'string') throw new Error('Expected text.')
      return value
    case 'Boolean':
      if (typeof value !== 'boolean') throw new Error('Expected a boolean.')
      return value
    case 'Integer':
      if (
        typeof value !== 'number' ||
        Number.isInteger(value) === false ||
        value < -2_147_483_648 ||
        value > 2_147_483_647
      )
        throw new Error('Expected a signed 32-bit integer.')
      return value
    case 'BigInt': {
      if (
        (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') ||
        (typeof value === 'string' && /^[-+]?\d+$/.test(value.trim()) === false) ||
        (typeof value === 'number' && Number.isSafeInteger(value) === false)
      )
        throw new Error('Expected an integer.')
      const integer = BigInt(value)
      // rowChanges constrains generic draft input even when Jazz can encode larger bigint values.
      if (integer < BigInt(Number.MIN_SAFE_INTEGER) || integer > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error('BigInt input must be within the JavaScript safe integer range.')
      }
      return Number(integer)
    }
    case 'Double':
      if (typeof value !== 'number' || Number.isFinite(value) === false) {
        throw new Error('Expected a finite number.')
      }
      return value
    case 'Timestamp':
      return timestamp(value)
    case 'Uuid':
      if (
        typeof value !== 'string' ||
        /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(
          value,
        ) === false
      )
        throw new Error('Expected a UUID.')
      return value
    case 'Enum':
      if (typeof value !== 'string' || type.variants.includes(value) === false) {
        throw new Error(`Expected one of: ${type.variants.join(', ')}`)
      }
      return value
    case 'Json':
      if (value === null) throw new Error('JSON null is not supported. Select SQL NULL instead.')
      return value
    case 'Bytea':
      throw new Error('Binary fields are read-only.')
    case 'Array':
      if (Array.isArray(value) === false) throw new Error('Expected an array.')
      return value.map((item: unknown) => normalize(type.element, item))
    case 'Row': {
      if (Array.isArray(value) === true) {
        if (value.length !== type.columns.length) throw new Error('Expected a complete row tuple.')
      } else {
        if (isRecord(value) === false)
          throw new Error('Expected a named row or complete row tuple.')
        if (
          Object.keys(value).some(
            (key) => type.columns.some((column) => column.name === key) === false,
          )
        ) {
          throw new Error('Row contains an unknown field.')
        }
      }
      return Object.fromEntries(
        type.columns.map((column, index) => {
          const member: unknown =
            Array.isArray(value) === true
              ? value[index]
              : isRecord(value) === true && Object.hasOwn(value, column.name)
                ? value[column.name]
                : undefined
          if (member === null || member === undefined) {
            if (column.nullable === false) throw new Error(`Row field ${column.name} is required.`)
            return [column.name, null]
          }
          return [column.name, normalize(column.column_type, member)]
        }),
      )
    }
  }
}

export function parseFieldText(type: ColumnType, text: string): unknown {
  if (containsBinary(type) === true) throw new Error('Binary fields are read-only.')
  switch (type.type) {
    case 'Text':
    case 'Enum':
    case 'Uuid':
      return normalize(type, text)
    case 'Boolean': {
      const value = text.trim().toLowerCase()
      if (value === 'true' || value === '1') return true
      if (value === 'false' || value === '0') return false
      throw new Error('Expected true or false.')
    }
    case 'Integer':
    case 'Double':
      if (text.trim().length === 0) throw new Error('Value is required.')
      return normalize(type, Number(text))
    case 'BigInt':
    case 'Timestamp':
      return normalize(type, text)
    case 'Json':
    case 'Array':
    case 'Row': {
      const parsed: unknown = JSON.parse(text, (_key, member: unknown) => {
        if (typeof member === 'number' && Number.isFinite(member) === false) {
          throw new Error('JSON numbers must be finite.')
        }
        return member
      })
      return normalize(type, parsed)
    }
    case 'Bytea':
      throw new Error('Binary fields are read-only.')
  }
}

export function resolveField(
  draft: RowDraft,
  column: ColumnDescriptor,
  intent: FieldIntent = fieldIntent(draft, column),
): FieldResolution {
  const invalid = (error: string): FieldResolution => ({
    kind: 'invalid',
    text: intent.text,
    error,
  })
  const readOnly = fieldReadOnlyReason(column)
  if (readOnly === 'automatic') return { kind: 'omitted' }
  if (intent.mode === 'omitted') {
    return draft.kind === 'insert' && column.default !== undefined
      ? { kind: 'omitted' }
      : invalid('Only default-backed insert fields can be omitted.')
  }
  if (intent.mode === 'null') {
    return column.nullable === true
      ? { kind: 'valid', value: null }
      : invalid('This field is not nullable.')
  }
  if (readOnly === 'binary') {
    const source = ownValue(draft.sourceValues, column.name)
    return source === undefined
      ? invalid('This read-only field requires a value.')
      : { kind: 'valid', value: source }
  }
  if (column.column_type.type === 'Enum' && column.nullable === true && intent.text.length === 0) {
    return invalid('Choose a value or select NULL.')
  }
  try {
    return { kind: 'valid', value: parseFieldText(column.column_type, intent.text) }
  } catch (error) {
    return invalid(error instanceof Error ? error.message : 'Invalid input.')
  }
}

function jsonEqual(
  left: unknown,
  right: unknown,
  compared = new WeakMap<object, object>(),
): boolean {
  if (Object.is(left, right) === true) return true
  if (left instanceof Uint8Array && right instanceof Uint8Array) {
    return left.length === right.length && left.every((byte, index) => byte === right[index])
  }
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) {
    return false
  }
  if (Array.isArray(left) !== Array.isArray(right)) return false
  if (compared.get(left) === right) return true
  compared.set(left, right)
  if (Array.isArray(left) === true && Array.isArray(right) === true) {
    return (
      left.length === right.length &&
      left.every((item: unknown, index) => jsonEqual(item, right[index], compared))
    )
  }
  if (isRecord(left) === true && isRecord(right) === true) {
    const keys = Object.keys(left)
    return (
      keys.length === Object.keys(right).length &&
      keys.every((key) => Object.hasOwn(right, key) && jsonEqual(left[key], right[key], compared))
    )
  }
  return false
}

export function valuesEqual(type: ColumnType, left: unknown, right: unknown): boolean {
  if (left === null || right === null || left === undefined || right === undefined) {
    return Object.is(left, right)
  }
  switch (type.type) {
    case 'Timestamp':
      try {
        return timestamp(left) === timestamp(right)
      } catch {
        return false
      }
    case 'BigInt':
      try {
        return BigInt(String(left)) === BigInt(String(right))
      } catch {
        return false
      }
    case 'Json':
    case 'Bytea':
      return jsonEqual(left, right)
    case 'Array':
      return (
        Array.isArray(left) === true &&
        Array.isArray(right) === true &&
        left.length === right.length &&
        left.every((member: unknown, index) => valuesEqual(type.element, member, right[index]))
      )
    case 'Row':
      if (
        (Array.isArray(left) === false && isRecord(left) === false) ||
        (Array.isArray(right) === false && isRecord(right) === false)
      )
        return false
      return type.columns.every((column, index) =>
        valuesEqual(
          column.column_type,
          Array.isArray(left) === true ? left[index] : ownValue(left, column.name),
          Array.isArray(right) === true ? right[index] : ownValue(right, column.name),
        ),
      )
    default:
      return Object.is(left, right)
  }
}

function removeInput(draft: RowDraft, name: string): RowDraft {
  if (Object.hasOwn(draft.fieldInputs, name) === false) return draft
  return {
    ...draft,
    fieldInputs: Object.fromEntries(
      Object.entries(draft.fieldInputs).filter(([key]) => key !== name),
    ),
  }
}

function reconcile(draft: RowDraft, column: ColumnDescriptor): RowDraft {
  if (draft.kind !== 'update') return draft
  const intent = ownValue(draft.fieldInputs, column.name)
  if (intent === undefined) return draft
  const resolved = resolveField(draft, column, intent)
  return resolved.kind === 'valid' &&
    valuesEqual(column.column_type, resolved.value, ownValue(draft.sourceValues, column.name)) ===
      true
    ? removeInput(draft, column.name)
    : draft
}

/** Invalid text is accepted as draft intent, not as a mutation value. */
export function editField(
  draft: RowDraft,
  column: ColumnDescriptor,
  intent: FieldIntent,
): DraftEdit {
  if (fieldReadOnlyReason(column) !== null) {
    return { kind: 'rejected', field: column.name, error: 'This field is read-only.' }
  }
  return {
    kind: 'changed',
    draft: reconcile(
      { ...draft, fieldInputs: { ...draft.fieldInputs, [column.name]: intent } },
      column,
    ),
  }
}

export function changeFieldMode(
  draft: RowDraft,
  column: ColumnDescriptor,
  mode: FieldIntent['mode'],
): DraftEdit {
  return editField(draft, column, setIntentMode(fieldIntent(draft, column), column, mode))
}

export function revertField(draft: RowDraft, column: ColumnDescriptor): RowDraft {
  if (draft.kind === 'update') return removeInput(draft, column.name)
  const initial = insertDraft([column], draft.sourceValues)
  const intent = ownValue(initial.fieldInputs, column.name)
  return intent === undefined
    ? removeInput(draft, column.name)
    : {
        ...draft,
        fieldInputs: { ...draft.fieldInputs, [column.name]: intent },
      }
}

/** Update-only removal used by row ledgers that carry a field name, not a descriptor. */
export function revertUpdateField(draft: RowDraft, name: string): RowDraft {
  return draft.kind === 'update' ? removeInput(draft, name) : draft
}

/**
 * @lat: [[rowChanges#Draft reconciliation]]
 * Rebase is not compare-and-swap or conflict resolution.
 * The caller must keep row identity stable; changing the selected row requires a separate draft.
 */
export function rebaseDraft(
  draft: RowDraft,
  source: DraftValues,
  columns: readonly ColumnDescriptor[],
): RowDraft {
  if (draft.kind !== 'update') return draft
  if (
    Object.is(draft.sourceValues.id, source.id) === true &&
    columns.every((column) =>
      valuesEqual(
        column.column_type,
        ownValue(draft.sourceValues, column.name),
        ownValue(source, column.name),
      ),
    ) === true
  )
    return draft
  let result: RowDraft = { ...draft, sourceValues: source }
  for (const column of columns) result = reconcile(result, column)
  return result
}

/** Encode JSON only at the public Jazz table boundary; do not build Jazz Value codecs here. */
function boundaryValue(type: ColumnType, value: unknown): unknown {
  switch (type.type) {
    case 'Json':
      return JSON.stringify(value)
    case 'Array':
      return Array.isArray(value) === true
        ? value.map((member: unknown) => boundaryValue(type.element, member))
        : value
    case 'Row':
      return Array.isArray(value) === true
        ? Object.fromEntries(
            type.columns.map((column, index) => [
              column.name,
              boundaryValue(column.column_type, value[index]),
            ]),
          )
        : isRecord(value) === true
          ? Object.fromEntries(
              type.columns.map((column) => [
                column.name,
                boundaryValue(column.column_type, value[column.name]),
              ]),
            )
          : value
    default:
      return value
  }
}

export interface DraftProjection {
  displayValues: Record<string, unknown>
  errors: Record<string, string>
  /** Valid fields only. The caller must check errors before any write. */
  submissionValues: Record<string, unknown>
}

/** A projection supports row previews even while another field contains invalid text. */
export function projectDraft(
  draft: RowDraft,
  columns: readonly ColumnDescriptor[],
): DraftProjection {
  const errors = new Map<string, string>()
  const values = new Map<string, unknown>()
  const payload = new Map<string, unknown>()
  const knownNames = new Set(columns.map((column) => column.name))
  for (const name of Object.keys(draft.fieldInputs)) {
    if (knownNames.has(name) === false)
      errors.set(name, 'Field is no longer present in the schema.')
  }
  for (const column of columns) {
    const hasInput = Object.hasOwn(draft.fieldInputs, column.name)
    if (draft.kind === 'update' && hasInput === false) continue
    const readOnly = fieldReadOnlyReason(column)
    if (readOnly === 'automatic') {
      if (hasInput === true) errors.set(column.name, 'This field is read-only.')
      continue
    }
    const resolved = resolveField(draft, column)
    if (resolved.kind === 'invalid') errors.set(column.name, resolved.error)
    if (resolved.kind !== 'valid') continue
    if (
      draft.kind === 'update' &&
      valuesEqual(column.column_type, resolved.value, ownValue(draft.sourceValues, column.name)) ===
        true
    ) {
      continue
    }
    values.set(column.name, resolved.value)
    // Top-level SQL NULL stays distinct from the encoded JSON documents in nested values.
    payload.set(
      column.name,
      resolved.value === null ? null : boundaryValue(column.column_type, resolved.value),
    )
  }
  return {
    displayValues: Object.fromEntries(values),
    errors: Object.fromEntries(errors),
    submissionValues: Object.fromEntries(payload),
  }
}

/** Invalid submissions cannot expose a partial mutation payload. @lat: [[rowChanges#Field intent]] */
export function submitDraft(
  draft: RowDraft,
  columns: readonly ColumnDescriptor[],
): DraftSubmission {
  const projection = projectDraft(draft, columns)
  return Object.keys(projection.errors).length === 0
    ? { kind: 'ready', values: projection.displayValues, payload: projection.submissionValues }
    : { kind: 'invalid', errors: projection.errors }
}
