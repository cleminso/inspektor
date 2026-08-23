/**
 * Parses Inspector filter inputs into values accepted by generic Jazz queries.
 *
 * The table explorer only has stored schema metadata, not generated app builders. Keeping
 * parsing here makes URL filters, relation links, and manual filters resolve through the
 * same schema-driven rules before they reach `GenericQueryBuilder`.
 */
import {
  getSupportedWhereOperatorsForColumn,
  getSupportedWhereOperatorsForSchemaColumn,
  type ColumnDescriptor,
  type ColumnType,
  type WasmSchema,
} from 'jazz-tools'

import {
  tableFilterOperators,
  type TableFilterClause,
  type TableFilterOperator,
} from '@tables/filters/tableFilters'
import { parseBooleanValue } from '@tables/valueParsing'

export const tableIdFilterColumn = {
  name: 'id',
  column_type: { type: 'Uuid' },
  nullable: false,
} as ColumnDescriptor

/** Supports Bytea filters with a simple comma-separated byte format in generic forms. */
function parseBytea(value: string): Uint8Array {
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
  const bytes = parts.map((part) => {
    const parsedNumber = Number(part)
    if (Number.isInteger(parsedNumber) === false || parsedNumber < 0 || parsedNumber > 255) {
      throw new Error('Bytea bytes must be integers in range 0..255.')
    }
    return parsedNumber
  })

  return new Uint8Array(bytes)
}

function parseJsonValue(value: string): unknown {
  const trimmedValue = value.trim()
  if (trimmedValue.length === 0) {
    return ''
  }

  try {
    return JSON.parse(trimmedValue) as unknown
  } catch {
    return trimmedValue
  }
}

/** Converts form text into the runtime value expected for one Jazz column type. */
function parseScalarValue(columnType: ColumnType, value: string): unknown {
  const trimmedValue = value.trim()
  if (trimmedValue.length === 0) {
    throw new Error('Value is required.')
  }

  switch (columnType.type) {
    case 'Boolean': {
      const parsedValue = parseBooleanValue(trimmedValue)
      if (parsedValue === null) {
        throw new Error('Boolean values must be "true" or "false".')
      }

      return parsedValue
    }
    case 'Integer': {
      const parsedValue = Number(trimmedValue)
      if (Number.isInteger(parsedValue) === false) {
        throw new Error('Integer values must be integers.')
      }

      return parsedValue
    }
    case 'Double': {
      const parsedValue = Number(trimmedValue)
      if (Number.isFinite(parsedValue) === false) {
        throw new Error('Numeric values must be finite numbers.')
      }

      return parsedValue
    }
    case 'BigInt': {
      try {
        BigInt(trimmedValue)
        return trimmedValue
      } catch {
        throw new Error('Value must be an integer.')
      }
    }
    case 'Timestamp': {
      const numericValue = Number(trimmedValue)
      if (Number.isFinite(numericValue) === true) return numericValue
      const parsedValue = Date.parse(trimmedValue)
      if (Number.isFinite(parsedValue) === false) {
        throw new Error('Value must be a timestamp.')
      }
      return parsedValue
    }
    case 'Bytea':
      return parseBytea(trimmedValue)
    case 'Json':
      return parseJsonValue(trimmedValue)
    case 'Array':
      return JSON.parse(trimmedValue) as unknown
    case 'Enum':
      if (columnType.variants.includes(trimmedValue) === false) {
        throw new Error(`Expected one of: ${columnType.variants.join(', ')}`)
      }
      return trimmedValue
    default:
      return trimmedValue
  }
}

/** Splits pasted scalar values by lines so commas remain valid token content. */
export function tokenizePastedFilterValues(value: string): string[] {
  return value
    .split(/\r?\n/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

/** Parses each scalar `in` token through the selected runtime column schema. */
export function parseFilterTokens(
  column: Pick<ColumnDescriptor, 'column_type'>,
  tokens: readonly string[],
): unknown[] {
  const normalizedTokens = tokens.map((token) => token.trim()).filter((token) => token.length > 0)
  if (normalizedTokens.length === 0) {
    throw new Error('The "in" operator requires at least one value.')
  }
  return normalizedTokens.map((token) => parseScalarValue(column.column_type, token))
}

/** Creates a client-only key for editable filter rows before they are serialized to the URL. */
export function createFilterClauseId(): string {
  return `filter-${crypto.randomUUID()}`
}

/** Applies operator-specific parsing before a filter becomes generic query input. */
export function parseFilterValue(
  column: Pick<ColumnDescriptor, 'column_type' | 'nullable'>,
  operator: TableFilterOperator,
  value: string,
): unknown {
  if (operator === 'isNull') {
    const parsedValue = parseBooleanValue(value)
    if (parsedValue === null) {
      throw new Error('isNull value must be "true" or "false".')
    }

    return parsedValue
  }

  if (operator === 'in') {
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    if (items.length === 0) {
      throw new Error('The "in" operator requires at least one value.')
    }

    return items.map((item) => parseScalarValue(column.column_type, item))
  }

  if (operator === 'contains' && column.column_type.type === 'Array') {
    return parseScalarValue(column.column_type.element, value)
  }

  return parseScalarValue(column.column_type, value)
}

/** Reads shareable URL filter state without letting malformed links break the explorer. */
export function parseFiltersFromSearchParam(value: string | null): TableFilterClause[] {
  if (value === null) {
    return []
  }

  try {
    const parsedValue = JSON.parse(value) as unknown
    if (Array.isArray(parsedValue) === false) {
      return []
    }

    return parsedValue.filter((item): item is TableFilterClause => {
      if (typeof item !== 'object' || item === null) {
        return false
      }

      const candidate = item as TableFilterClause
      const isValid =
        typeof candidate.id === 'string' &&
        typeof candidate.column === 'string' &&
        typeof candidate.operator === 'string' &&
        tableFilterOperators.some((operator) => operator === candidate.operator) &&
        Object.hasOwn(item, 'value')
      return isValid
    })
  } catch {
    return []
  }
}

/** Serializes table filters so telemetry and relation links can open the same explorer state. */
export function serializeFiltersToSearchParam(filters: TableFilterClause[]): string | null {
  if (filters.length === 0) {
    return null
  }

  return JSON.stringify(filters)
}

/** Delegates operator exposure to the Jazz-type support matrix used by the explorer UI. */
export function getFilterOperatorsForColumn(column: ColumnDescriptor): TableFilterOperator[] {
  return getSupportedWhereOperatorsForColumn({
    name: column.name,
    columnType: column.column_type,
    nullable: column.nullable,
    references: column.references,
  })
}

function getTableFilterPredicateFromValue(
  column: ColumnDescriptor,
  value: unknown,
): Pick<TableFilterClause, 'operator' | 'value'> | null {
  if (value === undefined) {
    return null
  }

  const supportedOperators = getFilterOperatorsForColumn(column)
  if (value === null) {
    if (supportedOperators.includes('isNull') === false) {
      return null
    }
    return { operator: 'isNull', value: true }
  }

  if (supportedOperators.includes('eq') === false) {
    return null
  }

  switch (column.column_type.type) {
    case 'Boolean':
      return typeof value === 'boolean' ? { operator: 'eq', value } : null
    case 'Integer':
      return typeof value === 'number' && Number.isInteger(value) ? { operator: 'eq', value } : null
    case 'Double':
      return typeof value === 'number' && Number.isFinite(value) ? { operator: 'eq', value } : null
    case 'Timestamp': {
      const epochMilliseconds = value instanceof Date ? value.getTime() : value
      return typeof epochMilliseconds === 'number' &&
        Number.isFinite(new Date(epochMilliseconds).getTime())
        ? { operator: 'eq', value: epochMilliseconds }
        : null
    }
    case 'BigInt':
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
        return null
      }
      if (typeof value === 'number' && Number.isSafeInteger(value) === false) {
        return null
      }
      try {
        return { operator: 'eq', value: String(BigInt(value)) }
      } catch {
        return null
      }
    case 'Enum':
      return typeof value === 'string' && column.column_type.variants.includes(value)
        ? { operator: 'eq', value }
        : null
    case 'Text':
    case 'Uuid':
      return typeof value === 'string' ? { operator: 'eq', value } : null
    default:
      return null
  }
}

export function canCreateTableFilterClauseFromValue(
  column: ColumnDescriptor,
  value: unknown,
): boolean {
  return getTableFilterPredicateFromValue(column, value) !== null
}

/** Builds the same normalized clause used by the Filter Builder from a runtime cell value. */
export function createTableFilterClauseFromValue(
  column: ColumnDescriptor,
  value: unknown,
): TableFilterClause | null {
  const predicate = getTableFilterPredicateFromValue(column, value)
  if (predicate === null) {
    return null
  }
  return {
    id: createFilterClauseId(),
    column: column.name,
    ...predicate,
  }
}

/** Keeps URL or telemetry clauses that can target the selected runtime table. */
export function filterTableFilterClauses({
  filters,
  schema,
  tableName,
}: {
  filters: readonly TableFilterClause[]
  schema: WasmSchema
  tableName: string
}): TableFilterClause[] {
  const table = schema[tableName]
  if (table === undefined) {
    return []
  }

  return filters.flatMap((filter) => {
    const column = table.columns.find((candidate) => candidate.name === filter.column)
    const supportedOperators = getSupportedWhereOperatorsForSchemaColumn(filter.column, column)
    if (supportedOperators?.includes(filter.operator) !== true) return []
    if (filter.operator === 'in' && Array.isArray(filter.value) === false) {
      return []
    }
    if (filter.operator === 'isNull' && typeof filter.value !== 'boolean') {
      return []
    }

    const parseColumn = column ?? (filter.column === 'id' ? tableIdFilterColumn : undefined)
    if (parseColumn === undefined) return []
    try {
      const value =
        filter.operator === 'in'
          ? parseFilterTokens(
              parseColumn,
              (filter.value as unknown[]).map((item) => String(item)),
            )
          : filter.operator === 'isNull'
            ? filter.value
            : parseColumn.column_type.type === 'Text' &&
                filter.operator === 'eq' &&
                typeof filter.value === 'string'
              ? filter.value
              : (parseColumn.column_type.type === 'Json' ||
                    parseColumn.column_type.type === 'Array') &&
                  typeof filter.value !== 'string'
                ? filter.value
                : parseFilterValue(parseColumn, filter.operator, String(filter.value))
      return [{ ...filter, value }]
    } catch {
      return []
    }
  })
}
