import type { ColumnDescriptor } from 'jazz-tools'
import { getFilterOperatorsForColumn } from '@inspektor/core/query'
import {
  tableFilterOperators,
  type TableFilterClause,
  type TableFilterValueMatch,
} from '@tables/filters/tableFilters'
import { normalizeTimestampValue } from '@tables/valueParsing'

export {
  filterTableFilterClauses,
  getFilterOperatorsForColumn,
  parseFilterTokens,
  parseFilterValue,
  tableIdFilterColumn,
} from '@inspektor/core/query'

export function tokenizePastedFilterValues(value: string): string[] {
  return value
    .split(/\r?\n/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function createFilterClauseId(): string {
  return `filter-${crypto.randomUUID()}`
}

/** The URL is untyped input; core receives only structurally valid clauses. */
export function parseFiltersFromSearchParam(value: string | null): TableFilterClause[] {
  if (value === null) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed) === false) return []
    return parsed.flatMap((item: unknown) => {
      if (
        typeof item !== 'object' ||
        item === null ||
        !('id' in item) ||
        !('column' in item) ||
        !('operator' in item) ||
        !('value' in item) ||
        Object.hasOwn(item, 'value') === false ||
        typeof item.id !== 'string' ||
        typeof item.column !== 'string'
      )
        return []
      const operator = tableFilterOperators.find((candidate) => candidate === item.operator)
      if (operator === undefined) return []
      return [{ id: item.id, column: item.column, operator, value: item.value }]
    })
  } catch {
    return []
  }
}

export function serializeFiltersToSearchParam(filters: TableFilterClause[]): string | null {
  return filters.length === 0 ? null : JSON.stringify(filters)
}

/** Cell values already have SDK types. Only create predicates the filter UI can represent. */
function getTableFilterPredicateFromValue(
  column: ColumnDescriptor,
  value: unknown,
  match: TableFilterValueMatch,
): Pick<TableFilterClause, 'operator' | 'value'> | null {
  if (value === undefined) return null
  const operators = getFilterOperatorsForColumn(column)
  if (value === null) {
    return operators.includes('isNull') === true
      ? { operator: 'isNull', value: match === 'include' }
      : null
  }
  const operator = match === 'include' ? 'eq' : 'ne'
  if (operators.includes(operator) === false) return null
  switch (column.column_type.type) {
    case 'Boolean':
      return typeof value === 'boolean' ? { operator, value } : null
    case 'Integer':
      return typeof value === 'number' && Number.isSafeInteger(value) ? { operator, value } : null
    case 'Double':
      return typeof value === 'number' && Number.isFinite(value) ? { operator, value } : null
    case 'Timestamp': {
      if (value instanceof Date === false && typeof value !== 'number') return null
      const timestamp = normalizeTimestampValue(value)
      return timestamp === null ? null : { operator, value: timestamp }
    }
    case 'BigInt':
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint')
        return null
      if (typeof value === 'number' && Number.isSafeInteger(value) === false) return null
      try {
        return { operator, value: String(BigInt(value)) }
      } catch {
        return null
      }
    case 'Enum':
      return typeof value === 'string' && column.column_type.variants.includes(value)
        ? { operator, value }
        : null
    case 'Text':
    case 'Uuid':
      return typeof value === 'string' ? { operator, value } : null
    default:
      return null
  }
}

export function canCreateTableFilterClauseFromValue(
  column: ColumnDescriptor,
  value: unknown,
  match: TableFilterValueMatch = 'include',
): boolean {
  return getTableFilterPredicateFromValue(column, value, match) !== null
}

export function createTableFilterClauseFromValue(
  column: ColumnDescriptor,
  value: unknown,
  match: TableFilterValueMatch = 'include',
): TableFilterClause | null {
  const predicate = getTableFilterPredicateFromValue(column, value, match)
  return predicate === null
    ? null
    : { id: createFilterClauseId(), column: column.name, ...predicate }
}
