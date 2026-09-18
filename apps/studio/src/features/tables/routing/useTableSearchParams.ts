/**
 * Ownership: the active table route owns shareable explorer state.
 * Projections: canonical route search becomes resolved UI state plus route-writing commands.
 * Persistence: TanStack Router stores the state in URL search and browser history.
 * Reset boundary: table-route navigation or a search command replaces the affected projection.
 */
import { useCallback, useMemo } from 'react'

import { useNavigate, useSearch } from '@tanstack/react-router'

import { serializeFiltersToSearchParam } from '@tables/filters/filterParsing'
import type { TableFilterClause } from '@tables/filters/tableFilters'
import {
  canonicalizeTableRouteSearch,
  resolveTableRowsSearch,
} from '@tables/routing/tableRowsSearch'
import type {
  TableExplorerSearchState,
  TableExplorerView,
  TablePageSize,
  TableRouteSearch,
  TableSortDirection,
} from '@tables/tableTypes'

/** Parsed table explorer URL state plus setters that write back to route search params. */
interface UseTableExplorerSearchParamsResult extends TableExplorerSearchState {
  setFilters: (filters: TableFilterClause[]) => Promise<void>
  setPage: (page: number) => Promise<void>
  setPageSize: (pageSize: TablePageSize) => Promise<void>
  setSorting: (sortColumn: string, sortDirection: TableSortDirection) => Promise<void>
}

function parseView(value: string | undefined): TableExplorerView {
  return value === 'schema' ? 'schema' : 'data'
}

/** Provides typed accessors for shareable table explorer route state. */
export function useTableExplorerSearchParams(): UseTableExplorerSearchParamsResult {
  const navigate = useNavigate({ from: '/conn/$connectionId/tables/$tableName/' })
  const search = useSearch({ from: '/conn/$connectionId/tables/$tableName/' })
  const searchDirection = search.dir
  const serializedFilters = search.filters
  const sortColumn = search.sort
  const filters = useMemo(
    () => resolveTableRowsSearch({ filters: serializedFilters }).filters,
    [serializedFilters],
  )
  const tableRowsSearch = useMemo(
    () =>
      resolveTableRowsSearch(
        {
          dir: searchDirection,
          page: search.page,
          pageSize: search.pageSize,
          sort: sortColumn,
        },
        filters,
      ),
    [filters, search.page, search.pageSize, searchDirection, sortColumn],
  )
  const state = useMemo<TableExplorerSearchState>(
    () => ({
      filters,
      page: tableRowsSearch.page,
      pageSize: tableRowsSearch.pageSize,
      sortColumn: tableRowsSearch.sortColumn,
      sortDirection: tableRowsSearch.sortDirection,
      view: parseView(search.view),
    }),
    [filters, search.view, tableRowsSearch],
  )

  const updateSearch = useCallback(
    async (updates: Partial<TableRouteSearch>): Promise<void> => {
      // Grid refinements replace the current history entry; table and tab navigation own history steps.
      await navigate({
        replace: true,
        search: (currentSearch) => canonicalizeTableRouteSearch({ ...currentSearch, ...updates }),
      })
    },
    [navigate],
  )
  // Stable commands prevent consumers from treating unchanged route behavior as new state.
  const setFilters = useCallback(
    async (filters: TableFilterClause[]) => {
      await updateSearch({
        filters: serializeFiltersToSearchParam(filters) ?? undefined,
        page: undefined,
      })
    },
    [updateSearch],
  )
  const setPage = useCallback(async (page: number) => updateSearch({ page }), [updateSearch])
  const setPageSize = useCallback(
    async (pageSize: TablePageSize) => updateSearch({ page: undefined, pageSize }),
    [updateSearch],
  )
  const setSorting = useCallback(
    async (sortColumn: string, sortDirection: TableSortDirection) => {
      await updateSearch({
        dir: sortDirection,
        page: undefined,
        sort: sortColumn,
      })
    },
    [updateSearch],
  )

  return {
    ...state,
    setFilters,
    setPage,
    setPageSize,
    setSorting,
  }
}
