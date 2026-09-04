import type { StructuredValuePreviewModel, StructuredValuePreviewVariant } from '@inspektor/ds'
import type { ColumnDescriptor } from 'jazz-tools'

import { normalizeTimestampValue } from '@tables/valueParsing'

const MAX_STRUCTURED_ITEMS = 3
const MAX_SUMMARY_VALUE_LENGTH = 80
const MAX_FALLBACK_LENGTH = 80

interface RawPresentation {
  rawValue: unknown
}

interface DisplayPresentation extends RawPresentation {
  displayValue: string
}

export type SchemaValuePresentation =
  | (DisplayPresentation & { kind: 'null' })
  | (DisplayPresentation & { kind: 'unavailable' })
  | (DisplayPresentation & { kind: 'text' })
  | (DisplayPresentation & { kind: 'number' })
  | (RawPresentation & { kind: 'boolean'; value: boolean })
  | (RawPresentation & { kind: 'timestamp'; epochMilliseconds: number })
  | (RawPresentation & { kind: 'bytes'; byteLength: number; value: Uint8Array })
  | (RawPresentation & {
      kind: 'relation'
      relationId: string
      relationTable: string
    })
  | (DisplayPresentation & { kind: 'enum'; value: string })
  | (RawPresentation & {
      kind: 'structured'
      model: StructuredValuePreviewModel
      variant: StructuredValuePreviewVariant
    })
  | (DisplayPresentation & {
      kind: 'invalid' | 'unsupported'
      expectation: string
      reason: string
    })

function boundText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1)}…`
}

function formatRawFallback(value: unknown): string {
  try {
    return boundText(String(value), MAX_FALLBACK_LENGTH)
  } catch {
    return 'Unrepresentable value'
  }
}

function formatBoundedJsonString(value: string): string {
  const codePointBudget = MAX_SUMMARY_VALUE_LENGTH - 3
  let preview = ''
  let codePointCount = 0

  for (const codePoint of value) {
    if (codePointCount === codePointBudget) {
      return JSON.stringify(`${preview}…`)
    }

    preview += codePoint
    codePointCount += 1
  }

  return JSON.stringify(preview)
}

function invalid(
  rawValue: unknown,
  expectation: string,
  reason = 'Runtime value does not match the schema',
): SchemaValuePresentation {
  return {
    kind: 'invalid',
    displayValue: formatRawFallback(rawValue),
    expectation,
    rawValue,
    reason,
  }
}

function unsupported(rawValue: unknown, expectation: string): SchemaValuePresentation {
  return {
    kind: 'unsupported',
    displayValue: formatRawFallback(rawValue),
    expectation,
    rawValue,
    reason: 'Inspector does not support this runtime value',
  }
}

function invalidOrUnsupported(rawValue: unknown, expectation: string): SchemaValuePresentation {
  const valueType = typeof rawValue
  return valueType === 'bigint' || valueType === 'function' || valueType === 'symbol'
    ? unsupported(rawValue, expectation)
    : invalid(rawValue, expectation)
}

function formatSummaryValue(value: unknown): string {
  if (value === null) {
    return 'null'
  }
  if (value === undefined) {
    return 'Unavailable'
  }
  if (typeof value === 'string') {
    return formatBoundedJsonString(value)
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return boundText(String(value), MAX_SUMMARY_VALUE_LENGTH)
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) === true ? 'Invalid timestamp' : 'Timestamp'
  }
  if (value instanceof Uint8Array) {
    return `Binary (${value.byteLength})`
  }
  if (Array.isArray(value) === true) {
    return '[…]'
  }
  if (typeof value === 'object') {
    return '{…}'
  }

  return boundText(formatRawFallback(value), MAX_SUMMARY_VALUE_LENGTH)
}

function normalizeArray(value: readonly unknown[]): StructuredValuePreviewModel {
  const entries: string[] = []
  const visibleCount = Math.min(value.length, MAX_STRUCTURED_ITEMS)
  for (let index = 0; index < visibleCount; index += 1) {
    entries.push(formatSummaryValue(value[index]))
  }

  return {
    kind: 'array',
    entries,
    totalCount: value.length,
    continuation: value.length > MAX_STRUCTURED_ITEMS ? 'truncated' : 'complete',
  }
}

function normalizeObject(value: object): StructuredValuePreviewModel {
  const entries: { label: string; value: string }[] = []
  let hasMore = false

  for (const key in value) {
    if (Object.hasOwn(value, key) === false) {
      continue
    }
    if (entries.length === MAX_STRUCTURED_ITEMS) {
      hasMore = true
      break
    }
    entries.push({
      label: boundText(key, MAX_SUMMARY_VALUE_LENGTH),
      value: formatSummaryValue((value as Record<string, unknown>)[key]),
    })
  }

  return {
    kind: 'object',
    entries,
    totalCount: hasMore === true ? null : entries.length,
    continuation: hasMore === true ? 'truncated' : 'complete',
  }
}

function normalizeStructuredValue(value: unknown): StructuredValuePreviewModel {
  if (Array.isArray(value) === true) {
    return normalizeArray(value)
  }
  if (value !== null && typeof value === 'object') {
    return normalizeObject(value)
  }

  return {
    kind: 'scalar',
    label: formatSummaryValue(value),
    continuation: 'complete',
  }
}

function isSupportedRecord(value: unknown): value is object {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) === true ||
    value instanceof Date ||
    value instanceof Uint8Array
  ) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isJsonScalar(value: unknown): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value) === true)
  )
}

function structured(
  rawValue: unknown,
  variant: StructuredValuePreviewVariant,
  expectation: string,
): SchemaValuePresentation {
  try {
    return {
      kind: 'structured',
      model: normalizeStructuredValue(rawValue),
      rawValue,
      variant,
    }
  } catch {
    return invalid(rawValue, expectation, 'Could not inspect the structured value')
  }
}

function isSchemaCompatibleRowTuple(
  value: readonly unknown[],
  columns: readonly ColumnDescriptor[],
): boolean {
  if (columns.length === 0 || value.length !== columns.length) {
    return false
  }

  return columns.every((column, index) => {
    const tupleValue = value[index]
    if (tupleValue === null) {
      return column.nullable === true
    }
    if (tupleValue === undefined) {
      return false
    }

    const presentation = classifySchemaValue(tupleValue, column)
    return presentation.kind !== 'invalid' && presentation.kind !== 'unsupported'
  })
}

function isSchemaCompatibleRowRecord(value: object, columns: readonly ColumnDescriptor[]): boolean {
  const record = value as Record<string, unknown>
  const columnNames = new Set(columns.map((column) => column.name))
  if (Object.keys(record).some((key) => columnNames.has(key) === false)) {
    return false
  }

  return columns.every((column) => {
    const fieldValue = record[column.name]
    if (fieldValue === null) {
      return column.nullable === true
    }
    if (fieldValue === undefined) {
      return column.nullable === true
    }
    const presentation = classifySchemaValue(fieldValue, column)
    return presentation.kind !== 'invalid' && presentation.kind !== 'unsupported'
  })
}

export function classifySchemaValue(
  rawValue: unknown,
  column: ColumnDescriptor | null,
): SchemaValuePresentation {
  if (rawValue === undefined) {
    return { kind: 'unavailable', displayValue: 'Unavailable', rawValue }
  }
  if (rawValue === null) {
    return { kind: 'null', displayValue: 'NULL', rawValue }
  }
  if (column === null) {
    return typeof rawValue === 'string'
      ? { kind: 'text', displayValue: rawValue.length === 0 ? '""' : rawValue, rawValue }
      : invalidOrUnsupported(rawValue, 'text')
  }

  if (column.references !== undefined && column.column_type.type !== 'Array') {
    return typeof rawValue === 'string' && rawValue.trim().length > 0
      ? {
          kind: 'relation',
          rawValue,
          relationId: rawValue,
          relationTable: column.references,
        }
      : invalid(rawValue, 'a non-empty relation ID')
  }

  switch (column.column_type.type) {
    case 'Text':
    case 'Uuid':
      return typeof rawValue === 'string'
        ? { kind: 'text', displayValue: rawValue.length === 0 ? '""' : rawValue, rawValue }
        : invalidOrUnsupported(rawValue, 'text')
    case 'Integer':
      return typeof rawValue === 'number' && Number.isInteger(rawValue) === true
        ? { kind: 'number', displayValue: String(rawValue), rawValue }
        : invalid(rawValue, 'an integer')
    case 'BigInt': {
      const isIntegerString = typeof rawValue === 'string' && /^-?\d+$/.test(rawValue)
      const isIntegerNumber = typeof rawValue === 'number' && Number.isInteger(rawValue) === true
      return typeof rawValue === 'bigint' || isIntegerString === true || isIntegerNumber === true
        ? { kind: 'number', displayValue: String(rawValue), rawValue }
        : invalid(rawValue, 'an integer, bigint, or integer string')
    }
    case 'Double':
      return typeof rawValue === 'number' && Number.isFinite(rawValue) === true
        ? { kind: 'number', displayValue: String(rawValue), rawValue }
        : invalid(rawValue, 'a finite number')
    case 'Boolean':
      return typeof rawValue === 'boolean'
        ? { kind: 'boolean', rawValue, value: rawValue }
        : invalid(rawValue, 'a boolean')
    case 'Timestamp': {
      const epochMilliseconds =
        rawValue instanceof Date || typeof rawValue === 'number'
          ? normalizeTimestampValue(rawValue)
          : null
      return epochMilliseconds !== null
        ? { kind: 'timestamp', rawValue, epochMilliseconds }
        : invalid(rawValue, 'a valid Date or epoch milliseconds', 'Invalid timestamp')
    }
    case 'Bytea':
      return rawValue instanceof Uint8Array
        ? { kind: 'bytes', rawValue, value: rawValue, byteLength: rawValue.byteLength }
        : invalid(rawValue, 'a Uint8Array')
    case 'Enum':
      return typeof rawValue === 'string' && column.column_type.variants.includes(rawValue) === true
        ? { kind: 'enum', displayValue: rawValue, rawValue, value: rawValue }
        : invalid(rawValue, `one of: ${column.column_type.variants.join(', ')}`)
    case 'Array':
      try {
        return Array.isArray(rawValue) === true
          ? structured(rawValue, 'json', 'an array')
          : invalid(rawValue, 'an array')
      } catch {
        return invalid(rawValue, 'an array', 'Could not inspect the structured value')
      }
    case 'Row':
      try {
        return (isSupportedRecord(rawValue) === true &&
          isSchemaCompatibleRowRecord(rawValue, column.column_type.columns) === true) ||
          (Array.isArray(rawValue) === true &&
            isSchemaCompatibleRowTuple(rawValue, column.column_type.columns) === true)
          ? structured(rawValue, 'json', 'a Row object or descriptor-compatible tuple')
          : invalid(rawValue, 'a Row object or descriptor-compatible tuple')
      } catch {
        return invalid(
          rawValue,
          'a Row object or descriptor-compatible tuple',
          'Could not inspect the structured value',
        )
      }
    case 'Json': {
      try {
        const isSupported =
          isJsonScalar(rawValue) === true ||
          Array.isArray(rawValue) === true ||
          isSupportedRecord(rawValue) === true
        return isSupported === true
          ? structured(
              rawValue,
              column.column_type.schema === undefined ? 'json' : 'typedJson',
              'a supported JSON scalar, array, or object',
            )
          : invalid(rawValue, 'a supported JSON scalar, array, or object')
      } catch {
        return invalid(
          rawValue,
          'a supported JSON scalar, array, or object',
          'Could not inspect the structured value',
        )
      }
    }
  }
}
