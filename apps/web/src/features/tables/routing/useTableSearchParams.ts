/**
 * Synchronizes data-explorer UI state with the table route search params.
 *
 * Filters, sorting, selected row editor mode, and schema/data view are encoded in the URL
 * so Inspector links can restore a specific view into a Jazz table.
 */
import { useMemo } from 'react'

import { useNavigate, useSearch } from '@tanstack/react-router'

import { serializeFiltersToSearchParam } from '@tables/filters/filterParsing'
import type { TableFilterClause } from '@tables/filters/tableFilters'
import { resolveTableRowsSearch } from '@tables/routing/tableRowsSearch'
import type {
  DetailPaneMode,
  TableExplorerSearchState,
  TableExplorerView,
  TablePageSize,
  TableRouteSearch,
  TableRowId,
  TableSortDirection,
} from '@tables/tableTypes'

interface UpdateSearchOptions {
  replace?: boolean
}

/** Parsed table explorer URL state plus setters that write back to route search params. */
export interface UseTableExplorerSearchParamsResult extends TableExplorerSearchState {
  setFilters: (filters: TableFilterClause[]) => Promise<void>
  setPage: (page: number) => Promise<void>
  setPageSize: (pageSize: TablePageSize) => Promise<void>
  setRowEditor: (
    mode: DetailPaneMode | null,
    rowId?: TableRowId | null,
    options?: UpdateSearchOptions,
  ) => Promise<void>
  setSorting: (sortColumn: string, sortDirection: TableSortDirection) => Promise<void>
}

function parseView(value: string | undefined): TableExplorerView {
  return value === 'schema' ? 'schema' : 'data'
}

function parseEditorMode(value: string | null | undefined): DetailPaneMode | null {
  if (value === 'edit' || value === 'insert') {
    return value
  }

  return null
}

function parseRowId(value: string | null | undefined): TableRowId | null {
  if (value === null || value === undefined) {
    return null
  }

  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

/**
 * Provides typed accessors for table explorer route search state.
 *
 * The Inspector keeps filters, sorting, row editor mode, and schema/data view in the URL so
 * links reopen the same table context without storing this transient state in Jazz.
 */
export function useTableExplorerSearchParams(): UseTableExplorerSearchParamsResult {
  const navigate = useNavigate({ from: '/conn/$connectionId/tables/$tableName/' })
  const search = useSearch({ from: '/conn/$connectionId/tables/$tableName/' })
  const searchDirection = search.dir
  const serializedFilters = search.filters
  const sortColumn = search.sort

  /**
   * Why: the parsed filters array flows into useTableRows's query-builder memo and
   * useTableViewState's selection-scope key. When parsing lived inside the combined state
   * memo below, any unrelated search change — opening the row editor flips `mode`/`rowId`,
   * switching views flips `view` — re-ran the parse and produced a fresh array identity for
   * identical filter content, which rebuilt the generic query and added identity noise that
   * downstream stringified comparison keys then had to absorb.
   *
   * How: a dedicated memo keyed on the raw serialized string re-parses only when the filter
   * content actually changes. React compares the string by value, so the array identity now
   * follows filter content instead of following every URL update.
   *
   * What: downstream memos and effects re-run only on semantic filter changes. Opening or
   * closing the row editor and switching views no longer rebuild the query builder, which
   * removes the wasted query churn and shrinks what downstream comparison keys must defend
   * against at this boundary.
   */
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

  const state = useMemo<TableExplorerSearchState>(() => {
    const editorMode = parseEditorMode(search.mode)
    const rowId = parseRowId(search.rowId)
    // Edit mode requires a stable Jazz row ID; invalid URLs fall back to the data table.
    const resolvedEditorMode = editorMode === 'edit' && rowId === null ? null : editorMode

    return {
      editorMode: resolvedEditorMode,
      // Opening the row editor always returns the user to data rows, even from schema view.
      view: resolvedEditorMode !== null ? 'data' : parseView(search.view),
      filters,
      page: tableRowsSearch.page,
      pageSize: tableRowsSearch.pageSize,
      rowId: resolvedEditorMode === 'edit' ? rowId : null,
      sortColumn: tableRowsSearch.sortColumn,
      sortDirection: tableRowsSearch.sortDirection,
    }
  }, [filters, search.mode, search.rowId, search.view, tableRowsSearch])

  const createNextSearch = (
    baseSearch: TableRouteSearch,
    updates: Partial<TableRouteSearch>,
  ): TableRouteSearch => {
    const nextSearch: TableRouteSearch = {
      ...baseSearch,
      ...updates,
    }

    // Remove default values so generated URLs stay readable and shareable.
    delete nextSearch.tab
    if (nextSearch.view === 'data' || nextSearch.view === undefined) {
      delete nextSearch.view
    }
    if (nextSearch.sort === 'id' || nextSearch.sort === undefined) {
      delete nextSearch.sort
    }
    if (nextSearch.dir === 'asc' || nextSearch.dir === undefined) {
      delete nextSearch.dir
    }
    if (nextSearch.filters === null || nextSearch.filters === undefined) {
      delete nextSearch.filters
    }
    if (nextSearch.page === 1 || nextSearch.page === undefined) {
      delete nextSearch.page
    }
    if (nextSearch.pageSize === 100 || nextSearch.pageSize === undefined) {
      delete nextSearch.pageSize
    }
    if (nextSearch.mode !== 'edit' && nextSearch.mode !== 'insert') {
      delete nextSearch.mode
      delete nextSearch.rowId
    }
    if (nextSearch.mode === 'insert') {
      delete nextSearch.rowId
    }
    if (nextSearch.mode === 'edit') {
      const rowId = parseRowId(nextSearch.rowId)
      if (rowId === null) {
        delete nextSearch.mode
        delete nextSearch.rowId
      } else {
        nextSearch.rowId = rowId
      }
    }

    return nextSearch
  }

  const updateSearch = async (
    updates: Partial<TableRouteSearch>,
    options?: UpdateSearchOptions,
  ): Promise<void> => {
    await navigate({
      replace: options?.replace ?? true,
      search: (currentSearch) => createNextSearch(currentSearch, updates),
    })
  }

  return {
    ...state,
    setFilters: async (filters) => {
      await updateSearch({
        filters: serializeFiltersToSearchParam(filters) ?? undefined,
        mode: null,
        page: undefined,
        rowId: null,
      })
    },
    setPage: async (page) => {
      await updateSearch({ mode: null, page, rowId: null })
    },
    setPageSize: async (pageSize) => {
      await updateSearch({ mode: null, page: undefined, pageSize, rowId: null })
    },
    setRowEditor: async (mode, rowId = null, options) => {
      if (mode === 'edit') {
        await updateSearch({ mode, rowId }, options)
        return
      }

      if (mode === 'insert') {
        await updateSearch({ mode, rowId: null, view: 'data' }, options)
        return
      }

      await updateSearch({ mode: null, rowId: null }, options)
    },
    setSorting: async (sortColumn, sortDirection) => {
      await updateSearch({
        sort: sortColumn,
        dir: sortDirection,
        mode: null,
        page: undefined,
        rowId: null,
      })
    },
  }
}
