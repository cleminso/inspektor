/**
 * Converts generic form input into values accepted by Jazz mutations.
 *
 * Generated applications get typed mutation inputs from their schema. The Inspector does not
 * import that generated code, so it uses runtime `ColumnType` metadata to perform the equivalent
 * parsing and validation before calling Jazz.
 */
import type { ColumnType } from 'jazz-tools'

import { normalizeTimestampValue, parseBooleanValue } from '@tables/valueParsing'

/**
 * Converts integer input to the exact `Number` representation accepted by the installed Jazz
 * runtime, rejecting values that would lose precision at that boundary.
 */
function parseSafeBigIntValue(value: unknown): number {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new Error('Expected an integer value.')
  }

  let parsedValue: bigint
  try {
    parsedValue = BigInt(value)
  } catch {
    throw new Error('Expected an integer value.')
  }

  if (
    parsedValue < BigInt(Number.MIN_SAFE_INTEGER) ||
    parsedValue > BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    throw new Error("BigInt value must be within JavaScript's safe integer range.")
  }

  return Number(parsedValue)
}

/**
 * Validates parsed Array and Row members against their nested Jazz descriptors.
 *
 * Row values may arrive from Jazz as positional tuples, while Jazz mutations expect named
 * records. A tuple such as `["Ada", 37]` is therefore converted to `{ name: "Ada", age: 37 }`
 * using descriptor order before it crosses the mutation boundary.
 * Nested Json remains decoded for draft comparison and rejects Json null for the same reason as a
 * top-level Json field.
 */
function normalizeNestedMutationValue(columnType: ColumnType, value: unknown): unknown {
  if (columnType.type === 'Json') {
    if (value === null) {
      throw new Error('JSON null is not supported. Use SQL NULL where the schema permits it.')
    }
    return value
  }
  if (value === null || value === undefined) {
    return null
  }

  switch (columnType.type) {
    case 'Boolean':
      if (typeof value !== 'boolean') throw new Error('Expected a boolean value.')
      return value
    case 'Integer':
      if (typeof value !== 'number' || Number.isSafeInteger(value) === false) {
        throw new Error('Expected an integer value.')
      }
      return value
    case 'Double':
      if (typeof value !== 'number' || Number.isFinite(value) === false) {
        throw new Error('Expected a finite numeric value.')
      }
      return value
    case 'BigInt':
      return parseSafeBigIntValue(value)
    case 'Timestamp': {
      if (typeof value !== 'number' && typeof value !== 'string') {
        throw new Error('Expected a timestamp value.')
      }
      const parsedValue = normalizeTimestampValue(value)
      if (parsedValue === null) {
        throw new Error('Expected a timestamp value.')
      }
      return parsedValue
    }
    case 'Text':
    case 'Uuid':
      if (typeof value !== 'string') throw new Error('Expected a text value.')
      return value
    case 'Enum':
      if (typeof value !== 'string' || columnType.variants.includes(value) === false) {
        throw new Error(`Expected one of: ${columnType.variants.join(', ')}`)
      }
      return value
    case 'Bytea':
      throw new Error('Binary fields are read-only in the inspector.')
    case 'Array':
      if (Array.isArray(value) === false) throw new Error('Expected an array value.')
      return value.map((item) => normalizeNestedMutationValue(columnType.element, item))
    case 'Row': {
      const isTuple = Array.isArray(value)
      if ((typeof value !== 'object' || value === null) && isTuple === false) {
        throw new Error('Expected a row value.')
      }
      if (isTuple === true && value.length !== columnType.columns.length) {
        throw new Error('Expected a complete row tuple.')
      }
      const record = value as Record<string, unknown>
      if (isTuple === false) {
        const knownColumnNames = new Set(columnType.columns.map((column) => column.name))
        if (Object.keys(record).some((key) => knownColumnNames.has(key) === false)) {
          throw new Error('Row value contains an unknown field.')
        }
      }
      return Object.fromEntries(
        columnType.columns.map((column, index) => {
          const fieldValue = isTuple === true ? value[index] : record[column.name]
          if ((fieldValue === null || fieldValue === undefined) && column.nullable === false) {
            throw new Error(`Row field ${column.name} is required.`)
          }
          return [column.name, normalizeNestedMutationValue(column.column_type, fieldValue)]
        }),
      )
    }
  }
}

/**
 * Converts one text field into the JavaScript value expected by the Jazz mutation converter.
 *
 * Text and Enum preserve their original text. Numbers become numbers, timestamps become epoch
 * milliseconds, and Json, Array, and Row input use JSON syntax. SQL NULL and omitted defaults are
 * not parsed here; `rowMutationDraft.ts` represents those as separate field modes.
 *
 * The installed Jazz runtime represents BigInt mutations with JavaScript `Number`, so this parser
 * rejects values outside the safe integer range rather than allowing silent precision loss.
 * JSON null is rejected because Jazz reads it back indistinguishably from SQL NULL; nullable JSON
 * columns use the separate NULL field mode for SQL NULL.
 */
export function parseMutationFieldValue(columnType: ColumnType, valueText: string): unknown {
  const trimmedValue = valueText.trim()

  switch (columnType.type) {
    case 'Boolean': {
      const parsedValue = parseBooleanValue(trimmedValue)
      if (parsedValue === null) {
        throw new Error('Boolean values must be "true" or "false".')
      }
      return parsedValue
    }
    case 'Integer': {
      if (trimmedValue.length === 0) {
        throw new Error('Value is required.')
      }
      const parsedValue = Number(trimmedValue)
      if (Number.isSafeInteger(parsedValue) === false) {
        if (Number.isInteger(parsedValue) === true) {
          throw new Error('Value must be within JavaScript safe integer range.')
        }
        throw new Error('Value must be an integer.')
      }
      return parsedValue
    }
    case 'BigInt': {
      if (trimmedValue.length === 0) {
        throw new Error('Value is required.')
      }
      try {
        return parseSafeBigIntValue(trimmedValue)
      } catch (error) {
        if (error instanceof Error && error.message.includes('safe integer range')) {
          throw error
        }
        throw new Error('Value must be an integer.')
      }
    }
    case 'Double': {
      if (trimmedValue.length === 0) {
        throw new Error('Value is required.')
      }
      const parsedValue = Number(trimmedValue)
      if (Number.isFinite(parsedValue) === false) {
        throw new Error('Value must be a finite number.')
      }
      return parsedValue
    }
    case 'Timestamp': {
      if (trimmedValue.length === 0) {
        throw new Error('Timestamp is required.')
      }
      const parsedValue = normalizeTimestampValue(trimmedValue)
      if (parsedValue !== null) {
        return parsedValue
      }
      throw new Error('Timestamp must be milliseconds or an ISO date string.')
    }
    case 'Json': {
      if (trimmedValue.length === 0) {
        throw new Error('JSON value is required.')
      }
      let parsedValue: unknown
      try {
        parsedValue = JSON.parse(trimmedValue) as unknown
      } catch {
        throw new Error('JSON value is invalid.')
      }
      if (parsedValue === null) {
        throw new Error('JSON null is not supported. Use the NULL field mode for SQL NULL.')
      }
      return parsedValue
    }
    case 'Bytea':
      throw new Error('Binary fields are read-only in the inspector.')
    case 'Array': {
      try {
        const parsedValue = JSON.parse(trimmedValue) as unknown
        return normalizeNestedMutationValue(columnType, parsedValue)
      } catch {
        throw new Error('Array must be valid JSON array.')
      }
    }
    case 'Row': {
      const errorMessage = 'Row value must be a valid JSON object or descriptor-compatible tuple.'
      try {
        const parsedValue = JSON.parse(trimmedValue) as unknown
        return normalizeNestedMutationValue(columnType, parsedValue)
      } catch {
        throw new Error(errorMessage)
      }
    }
    case 'Enum':
      if (columnType.variants.includes(valueText) === false) {
        throw new Error(`Expected one of: ${columnType.variants.join(', ')}`)
      }
      return valueText
    case 'Text':
    case 'Uuid':
    default:
      return valueText
  }
}

/**
 * Formats a Jazz row value for an editable text surface.
 *
 * Structured values use indented JSON, dates use ISO text, and binary values expose only their
 * size because the formatted string is not a round-trippable byte representation.
 */
export function formatMutationFieldValue(value: unknown, columnType: ColumnType): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (value instanceof Uint8Array) {
    return `(${value.length} bytes)`
  }
  if (columnType.type === 'Json' || columnType.type === 'Array' || columnType.type === 'Row') {
    try {
      return JSON.stringify(value, null, 2) ?? ''
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
