import type { IntrospectionSubscriptionGroup, QueryPropagation } from 'jazz-tools'

export function filterQuerySubscriptionTableNames(
  tableNames: string[],
  searchValue: string,
): string[] {
  const normalizedSearchValue = searchValue.trim().toLowerCase()

  if (normalizedSearchValue.length === 0) {
    return tableNames
  }

  return tableNames.filter((tableName) => tableName.toLowerCase().includes(normalizedSearchValue))
}

interface QuerySubscriptionFilters {
  selectedPropagations: QueryPropagation[]
  selectedTableName: string | null
}

export function filterQuerySubscriptionRows(
  rows: IntrospectionSubscriptionGroup[],
  filters: QuerySubscriptionFilters,
): IntrospectionSubscriptionGroup[] {
  const selectedPropagations = new Set(filters.selectedPropagations)

  return rows.filter((row) => {
    if (filters.selectedTableName !== null && row.table !== filters.selectedTableName) {
      return false
    }

    if (selectedPropagations.size > 0 && selectedPropagations.has(row.propagation) === false) {
      return false
    }

    return true
  })
}
