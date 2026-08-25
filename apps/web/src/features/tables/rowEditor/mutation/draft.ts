/**
 * Surface-independent row mutation state for schema-driven insert and update interfaces.
 *
 * Jazz owns schema and persistence semantics. This module retains editable input, determines
 * mutation intent and builds values for the Jazz mutation boundary.
 */
import type { ColumnDescriptor, ColumnType, Value } from 'jazz-tools'

import {
  formatMutationFieldValue,
  parseMutationFieldValue,
} from '@tables/rowEditor/mutation/parsing'
import { getFieldReadOnlyReason } from '@tables/schema/fieldEditability'

/** The database operation represented by one editable field. */
export type MutationFieldMode = 'null' | 'omitted' | 'value'
// "null": submit SQL `NULL`
// "omitted": do not include the field, allowing Jazz to apply its default value
// "value": parse and submit `text` the editable representation

/** Retains editable text independently from its active value, NULL, or omission mode. */
export interface MutationFieldInput {
  mode: MutationFieldMode
  text: string
}

/**
 * A single row's mutation intent over its latest Jazz source values.
 *
 * Updates use `fieldInputs` as a sparse dirty overlay: missing keys are untouched and only
 * present keys can enter the patch. Inserts store every field and compare them with the
 * schema-derived `initialFieldInputs` baseline.
 */
export interface RowMutationDraft {
  fieldInputs: Readonly<Record<string, MutationFieldInput>>
  initialFieldInputs: Readonly<Record<string, MutationFieldInput>>
  kind: 'insert' | 'update'
  sourceValues: Readonly<Record<string, unknown>>
}

/** Jazz-ready mutation values and field-level errors produced from one draft. */
export interface RowMutationSubmission {
  errors: Record<string, string>
  values: Record<string, unknown>
}

export interface RowMutationValueProjection {
  displayValues: Record<string, unknown>
  errors: Record<string, string>
  submissionValues: Record<string, unknown>
}

function areMutationFieldInputsEqual(left: MutationFieldInput, right: MutationFieldInput): boolean {
  // NULL and DEFAULT ignore retained text so hidden values can be restored without staying dirty.
  return left.mode === right.mode && (left.mode !== 'value' || left.text === right.text)
}

function createValueInput(value: unknown, column: ColumnDescriptor): MutationFieldInput {
  return {
    mode: value === null || value === undefined ? 'null' : 'value',
    text: formatMutationFieldValue(value, column.column_type),
  }
}

function decodeColumnDefault(value: Value, columnType: ColumnType): unknown {
  switch (value.type) {
    case 'Null':
      return null
    case 'Integer':
    case 'BigInt':
    case 'Double':
    case 'Boolean':
    case 'Text':
    case 'Timestamp':
    case 'Uuid':
      return columnType.type === 'Json' ? JSON.parse(String(value.value)) : value.value
    case 'Bytea':
      return new Uint8Array(value.value)
    case 'Array':
      if (columnType.type !== 'Array') {
        throw new Error('Array default does not match its column type.')
      }
      return value.value.map((item) => decodeColumnDefault(item, columnType.element))
    case 'Row':
      throw new Error('Row-valued defaults are not supported by the Jazz schema loader.')
  }
}

/** Formats a default for display only; the returned text is never sent back as that default. */
export function formatColumnDefault(column: ColumnDescriptor): string {
  if (column.default === undefined) {
    return ''
  }
  try {
    return formatMutationFieldValue(
      decodeColumnDefault(column.default, column.column_type),
      column.column_type,
    )
  } catch {
    return ''
  }
}

/**
 * Creates an update draft with no staged fields.
 *
 * Untouched fields remain absent from `fieldInputs` and are read from `sourceValues`. Editing
 * `name` adds only `name` to the overlay, so saving cannot overwrite other live columns.
 */
export function createUpdateRowDraft(
  sourceValues: Readonly<Record<string, unknown>>,
): RowMutationDraft {
  return { fieldInputs: {}, initialFieldInputs: {}, kind: 'update', sourceValues }
}

/**
 * Creates a complete insert draft using this precedence for every schema column:
 *
 * 1. Use a supplied value, including explicit `null`.
 * 2. Mark a default-backed column as `omitted`.
 * 3. Initialize a nullable column as `null`.
 * 4. Initialize a required column as an empty `value` input.
 *
 * Default-backed fields are not decoded and submitted as ordinary values. Their display text
 * is only a preview; omission leaves Jazz responsible for default expressions, generated values,
 * default changes, and other database-side semantics.
 */
export function createInsertRowDraft(
  sourceValues: Readonly<Record<string, unknown>>,
  columns: readonly ColumnDescriptor[],
): RowMutationDraft {
  const fieldInputs = Object.fromEntries(
    columns.map((column): [string, MutationFieldInput] => {
      const suppliedValue = sourceValues[column.name]
      if (suppliedValue !== undefined) {
        return [column.name, createValueInput(suppliedValue, column)]
      }
      if (column.default !== undefined) {
        return [
          column.name,
          {
            mode: 'omitted',
            text: formatColumnDefault(column),
          },
        ]
      }
      if (column.nullable === true) {
        return [column.name, { mode: 'null', text: '' }]
      }
      return [column.name, { mode: 'value', text: '' }]
    }),
  )

  return { fieldInputs, initialFieldInputs: fieldInputs, kind: 'insert', sourceValues }
}

export function getMutationFieldInput(
  draft: RowMutationDraft,
  column: ColumnDescriptor,
): MutationFieldInput {
  return draft.fieldInputs[column.name] ?? createValueInput(draft.sourceValues[column.name], column)
}

function deepEqual(left: unknown, right: unknown, compared: WeakMap<object, object>): boolean {
  if (Object.is(left, right)) {
    return true
  }
  if (left instanceof Uint8Array && right instanceof Uint8Array) {
    return left.length === right.length && left.every((byte, index) => byte === right[index])
  }
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) {
    return false
  }
  if (Array.isArray(left) !== Array.isArray(right)) {
    return false
  }
  if (compared.get(left) === right) {
    return true
  }
  compared.set(left, right)

  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (
    leftKeys.length !== rightKeys.length ||
    leftKeys.some((key) => rightKeys.includes(key) === false)
  ) {
    return false
  }

  const leftRecord = left as Record<string, unknown>
  const rightRecord = right as Record<string, unknown>
  return leftKeys.every((key) => deepEqual(leftRecord[key], rightRecord[key], compared))
}

function normalizeTimestamp(value: unknown): number | null {
  if (value instanceof Date) {
    const timestamp = value.getTime()
    return Number.isFinite(timestamp) === true ? timestamp : null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) === true ? value : null
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const numericValue = Number(value)
    if (Number.isFinite(numericValue) === true) {
      return numericValue
    }
    const parsedValue = Date.parse(value)
    return Number.isFinite(parsedValue) === true ? parsedValue : null
  }
  return null
}

function areMutationValuesEqual(columnType: ColumnType, left: unknown, right: unknown): boolean {
  if (left === null || left === undefined || right === null || right === undefined) {
    return (left === null || left === undefined) && (right === null || right === undefined)
  }

  switch (columnType.type) {
    case 'Timestamp':
      return normalizeTimestamp(left) === normalizeTimestamp(right)
    case 'BigInt':
      try {
        return BigInt(String(left)) === BigInt(String(right))
      } catch {
        return false
      }
    case 'Bytea':
    case 'Json':
      return deepEqual(left, right, new WeakMap())
    case 'Array':
      return (
        Array.isArray(left) === true &&
        Array.isArray(right) === true &&
        left.length === right.length &&
        left.every((value, index) =>
          areMutationValuesEqual(columnType.element, value, right[index]),
        )
      )
    case 'Row': {
      if (typeof left !== 'object' || typeof right !== 'object') {
        return false
      }
      const leftRecord = left as Record<string, unknown>
      const rightRecord = right as Record<string, unknown>
      return columnType.columns.every((column, index) => {
        const leftValue = Array.isArray(left) === true ? left[index] : leftRecord[column.name]
        const rightValue = Array.isArray(right) === true ? right[index] : rightRecord[column.name]
        return areMutationValuesEqual(column.column_type, leftValue, rightValue)
      })
    }
    default:
      return Object.is(left, right)
  }
}

type ResolvedMutationField =
  | { kind: 'invalid'; error: string }
  | { kind: 'null' }
  | { kind: 'omitted' }
  | { kind: 'valid'; value: unknown }

function resolveMutationField(
  draft: RowMutationDraft,
  column: ColumnDescriptor,
  input: MutationFieldInput,
): ResolvedMutationField {
  if (input.mode === 'omitted') {
    if (draft.kind === 'insert' && column.default !== undefined) {
      return { kind: 'omitted' }
    }
    return { kind: 'invalid', error: 'This column cannot be omitted.' }
  }
  if (input.mode === 'null') {
    return column.nullable === true
      ? { kind: 'null' }
      : { kind: 'invalid', error: 'This column is not nullable.' }
  }
  if (getFieldReadOnlyReason(column) !== null) {
    const sourceValue = draft.sourceValues[column.name]
    return sourceValue === undefined
      ? { kind: 'invalid', error: 'This read-only column requires a value.' }
      : { kind: 'valid', value: sourceValue }
  }

  try {
    return { kind: 'valid', value: parseMutationFieldValue(column.column_type, input.text) }
  } catch (error) {
    return { kind: 'invalid', error: error instanceof Error ? error.message : String(error) }
  }
}

export function getMutationFieldError(
  draft: RowMutationDraft,
  column: ColumnDescriptor,
  input: MutationFieldInput,
): string | undefined {
  const resolved = resolveMutationField(draft, column, input)
  return resolved.kind === 'invalid' ? resolved.error : undefined
}

/**
 * Converts parsed semantic values into the installed Jazz mutation representation.
 *
 * Jazz treats strings passed to Json columns as complete encoded JSON documents. Encoding happens
 * only here so draft equality can still compare decoded strings, objects, numbers, and booleans.
 */
function prepareMutationValueForJazz(columnType: ColumnType, value: unknown): unknown {
  switch (columnType.type) {
    case 'Json':
      return JSON.stringify(value)
    case 'Array':
      return Array.isArray(value)
        ? value.map((item) => prepareMutationValueForJazz(columnType.element, item))
        : value
    case 'Row': {
      if (typeof value !== 'object' || value === null) {
        return value
      }
      const record = value as Record<string, unknown>
      return Object.fromEntries(
        columnType.columns.map((column) => [
          column.name,
          prepareMutationValueForJazz(column.column_type, record[column.name]),
        ]),
      )
    }
    default:
      return value
  }
}

function removeCleanUpdateInput(
  draft: RowMutationDraft,
  column: ColumnDescriptor,
  input: MutationFieldInput,
): RowMutationDraft {
  if (draft.kind !== 'update') {
    return draft
  }
  const resolved = resolveMutationField(draft, column, input)
  const sourceValue = draft.sourceValues[column.name]
  const isClean =
    (resolved.kind === 'null' && (sourceValue === null || sourceValue === undefined)) ||
    (resolved.kind === 'valid' &&
      areMutationValuesEqual(column.column_type, resolved.value, sourceValue) === true)
  if (isClean === false) {
    return draft
  }

  const { [column.name]: removedInput, ...fieldInputs } = draft.fieldInputs
  void removedInput
  return { ...draft, fieldInputs }
}

export function setMutationFieldInput(
  draft: RowMutationDraft,
  column: ColumnDescriptor,
  input: MutationFieldInput,
): RowMutationDraft {
  const nextDraft = {
    ...draft,
    fieldInputs: {
      ...draft.fieldInputs,
      [column.name]: input,
    },
  }
  return removeCleanUpdateInput(nextDraft, column, input)
}

export function setMutationFieldText(
  draft: RowMutationDraft,
  column: ColumnDescriptor,
  text: string,
): RowMutationDraft {
  return setMutationFieldInput(draft, column, { mode: 'value', text })
}

export function setMutationFieldMode(
  draft: RowMutationDraft,
  column: ColumnDescriptor,
  mode: MutationFieldMode,
): RowMutationDraft {
  const currentInput = getMutationFieldInput(draft, column)
  return setMutationFieldInput(draft, column, { ...currentInput, mode })
}

export function revertMutationField(draft: RowMutationDraft, fieldName: string): RowMutationDraft {
  if (draft.kind !== 'update' || draft.fieldInputs[fieldName] === undefined) {
    return draft
  }
  const { [fieldName]: removedInput, ...fieldInputs } = draft.fieldInputs
  void removedInput
  return { ...draft, fieldInputs }
}

export function isRowMutationDraftDirty(
  draft: RowMutationDraft,
  columns: readonly ColumnDescriptor[],
): boolean {
  if (draft.kind === 'update') {
    const columnsByName = new Map(columns.map((column) => [column.name, column]))
    return Object.entries(draft.fieldInputs).some(([columnName, input]) => {
      const column = columnsByName.get(columnName)
      if (column === undefined) {
        return false
      }
      const resolved = resolveMutationField(draft, column, input)
      const sourceValue = draft.sourceValues[columnName]
      return !(
        (resolved.kind === 'null' && (sourceValue === null || sourceValue === undefined)) ||
        (resolved.kind === 'valid' &&
          areMutationValuesEqual(column.column_type, resolved.value, sourceValue) === true)
      )
    })
  }

  return columns.some((column) => {
    const currentInput = getMutationFieldInput(draft, column)
    const initialInput = draft.initialFieldInputs[column.name]
    if (initialInput === undefined) {
      return true
    }
    return areMutationFieldInputsEqual(currentInput, initialInput) === false
  })
}

/**
 * Builds values accepted by the Jazz mutation boundary and reports invalid form fields.
 *
 * Inserts inspect every schema column so untouched required fields still fail validation. Updates
 * inspect only sparse overlay keys, preventing untouched live values from entering the patch.
 * `null` becomes an explicit SQL NULL value, while `omitted` contributes no payload property.
 * Parsed Json values are encoded only at this final boundary so draft equality stays semantic while
 * Jazz receives the complete JSON text it expects.
 */
export function buildRowMutationValueProjection(
  draft: RowMutationDraft,
  columns: readonly ColumnDescriptor[],
): RowMutationValueProjection {
  const displayValues: Record<string, unknown> = {}
  const errors: Record<string, string> = {}
  const submissionValues: Record<string, unknown> = {}
  // Inserts validate required untouched fields; updates submit only their sparse dirty overlay.
  const submittedColumns =
    draft.kind === 'insert'
      ? columns
      : columns.filter((column) => draft.fieldInputs[column.name] !== undefined)

  for (const column of submittedColumns) {
    const input = getMutationFieldInput(draft, column)
    const resolved = resolveMutationField(draft, column, input)
    if (resolved.kind === 'invalid') {
      errors[column.name] = resolved.error
    } else if (resolved.kind === 'null') {
      if (
        draft.kind !== 'update' ||
        (draft.sourceValues[column.name] !== null && draft.sourceValues[column.name] !== undefined)
      ) {
        displayValues[column.name] = null
        submissionValues[column.name] = null
      }
    } else if (resolved.kind === 'valid') {
      if (
        draft.kind !== 'update' ||
        areMutationValuesEqual(
          column.column_type,
          resolved.value,
          draft.sourceValues[column.name],
        ) === false
      ) {
        displayValues[column.name] = resolved.value
        submissionValues[column.name] = prepareMutationValueForJazz(
          column.column_type,
          resolved.value,
        )
      }
    }
  }

  return { displayValues, errors, submissionValues }
}

export function buildRowMutationSubmission(
  draft: RowMutationDraft,
  columns: readonly ColumnDescriptor[],
): RowMutationSubmission {
  const projection = buildRowMutationValueProjection(draft, columns)
  return { errors: projection.errors, values: projection.submissionValues }
}
