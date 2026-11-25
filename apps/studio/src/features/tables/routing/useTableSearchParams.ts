/**
 * Ownership: the active table route owns shareable explorer state.
 * Projections: canonical route search becomes resolved UI state plus route-writing commands.
 * Persistence: TanStack Router stores the state in URL search and browser history.
 * Reset boundary: table-route navigation or a search command replaces the affected projection.
 */
import { useCallback, useMemo } from 'react'

import { useNavigate, useSearch } from '@tanstack/react-router'

import { createFilterClauseId, serializeFiltersToSearchParam } from '@tables/filters/filterParsing'
import type { TableQueryIntent } from '@inspektor/core/query'
import {
  canonicalizeTableRouteSearch,
  resolveTableRowsSearch,
} from '@tables/routing/tableRowsSearch'
import type {
  TableExplorerSearchState,
  TableExplorerView,
  TableRouteSearch,
} from '@tables/tableTypes'

/** URL serialization does not decide query transitions or prepare Jazz work. */
interface UseTableExplorerSearchParamsResult extends TableExplorerSearchState {
  commitQuery: (intent: TableQueryIntent) => Promise<void>
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
  const commitQuery = useCallback(
    async (intent: TableQueryIntent) => {
      await updateSearch({
        filters:
          serializeFiltersToSearchParam(
            intent.filters.map((filter) => ({
              ...filter,
              id:
                'id' in filter && typeof filter.id === 'string'
                  ? filter.id
                  : createFilterClauseId(),
            })),
          ) ?? undefined,
        page: intent.page,
        pageSize: intent.pageSize,
        sort: intent.sortColumn,
        dir: intent.sortDirection,
      })
    },
    [updateSearch],
  )

  return {
    ...state,
    commitQuery,
  }
}
