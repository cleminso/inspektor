import { parseFiltersFromSearchParam } from '@tables/filters/filterParsing'
import type { TableFilterClause } from '@tables/filters/tableFilters'
import type { TablePageSize, TableSortDirection } from '@tables/tableTypes'

interface TableRowsSearchInput {
  dir?: string
  filters?: string
  page?: number
  pageSize?: number
  sort?: string
}

export interface ResolvedTableRowsSearch {
  filters: TableFilterClause[]
  page: number
  pageSize: TablePageSize
  sortColumn: string
  sortDirection: TableSortDirection
}

/** Resolves stored route or tab search into the exact inputs used by a table-row query. */
export function resolveTableRowsSearch(
  search: TableRowsSearchInput,
  parsedFilters = parseFiltersFromSearchParam(search.filters ?? null),
): ResolvedTableRowsSearch {
  return {
    filters: parsedFilters,
    page:
      Number.isInteger(search.page) && search.page !== undefined && search.page > 0
        ? search.page
        : 1,
    pageSize: search.pageSize === 500 || search.pageSize === 1000 ? search.pageSize : 100,
    sortColumn: search.sort ?? 'id',
    sortDirection: search.dir === 'desc' ? 'desc' : 'asc',
  }
}
