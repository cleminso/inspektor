/**
 * Ownership: owns table-search validation, defaults, and canonical serialization policy, not state.
 * Projections: untrusted route or stored-tab search becomes canonical URL state or resolved query state.
 * Persistence: none; route and tab adapters persist only the canonical projection.
 * Reset boundary: outputs are recomputed whenever their raw search input changes.
 */
import {
  parseFiltersFromSearchParam,
  serializeFiltersToSearchParam,
} from '@tables/filters/filterParsing'
import {
  DEFAULT_TABLE_PAGE_SIZE,
  type TablePageSize,
  type TableRouteSearch,
  type TableRowsSearchInput,
  type TableRowsSearchState,
  type TableTabSearch,
} from '@tables/tableTypes'

function parsePositiveInteger(value: unknown): number | undefined {
  const numberValue = typeof value === 'string' ? Number(value) : value
  return typeof numberValue === 'number' && Number.isSafeInteger(numberValue) && numberValue > 0
    ? numberValue
    : undefined
}

function parsePageSize(value: unknown): TablePageSize | undefined {
  const pageSize = parsePositiveInteger(value)
  return pageSize === 100 || pageSize === 500 || pageSize === 1000 ? pageSize : undefined
}

function parsePage(value: unknown, pageSize: TablePageSize): number | undefined {
  const page = parsePositiveInteger(value)
  return page !== undefined && (page - 1) * pageSize <= Number.MAX_SAFE_INTEGER ? page : undefined
}

function parseTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : undefined
}

/** Converts untrusted route or stored-tab search into one canonical URL representation. */
export function canonicalizeTableRouteSearch(search: Record<string, unknown>): TableRouteSearch {
  const pageSize = parsePageSize(search.pageSize) ?? DEFAULT_TABLE_PAGE_SIZE
  const page = parsePage(search.page, pageSize)
  const filters = serializeFiltersToSearchParam(
    parseFiltersFromSearchParam(typeof search.filters === 'string' ? search.filters : null),
  )
  const mode = search.mode === 'edit' || search.mode === 'insert' ? search.mode : undefined
  const rowId = parseTrimmedString(search.rowId)
  const sort = parseTrimmedString(search.sort)

  return {
    dir: search.dir === 'desc' ? 'desc' : undefined,
    empty: search.empty === 'true' ? 'true' : undefined,
    filters: filters ?? undefined,
    mode: mode === 'edit' && rowId === undefined ? undefined : mode,
    page: page !== undefined && page > 1 ? page : undefined,
    pageSize: pageSize === DEFAULT_TABLE_PAGE_SIZE ? undefined : pageSize,
    rowId: mode === 'edit' ? rowId : undefined,
    sort: sort === 'id' ? undefined : sort,
    view: mode === undefined && search.view === 'schema' ? 'schema' : undefined,
  }
}

export function toTableTabSearch(search: Record<string, unknown>): TableTabSearch {
  const canonicalSearch = canonicalizeTableRouteSearch(search)
  return {
    dir: canonicalSearch.dir,
    filters: canonicalSearch.filters,
    page: canonicalSearch.page,
    pageSize: canonicalSearch.pageSize,
    sort: canonicalSearch.sort,
    view: canonicalSearch.view,
  }
}

/** Resolves stored route or tab search into the exact inputs used by a table-row query. */
export function resolveTableRowsSearch(
  search: TableRowsSearchInput,
  parsedFilters = parseFiltersFromSearchParam(search.filters ?? null),
): TableRowsSearchState {
  const pageSize = parsePageSize(search.pageSize) ?? DEFAULT_TABLE_PAGE_SIZE
  return {
    filters: parsedFilters,
    page: parsePage(search.page, pageSize) ?? 1,
    pageSize,
    sortColumn: search.sort ?? 'id',
    sortDirection: search.dir === 'desc' ? 'desc' : 'asc',
  }
}
