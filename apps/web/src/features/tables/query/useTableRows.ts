/**
 * Runs schema-driven table queries for the Inspector data explorer.
 *
 * The hook turns route search state into a generic Jazz query, derives render columns from
 * stored schema metadata, and loads one URL-backed page without app-generated table types.
 */
import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { type DynamicTableRow, type WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'

import { buildTableRowsQuery, isTableColumnSortable } from '@tables/query/tableRowsQuery'
import { INSPECTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'
import { useJazzQueryState } from '@tables/query/useJazzQueryState'
import { getTableColumns } from '@tables/schema/tableSchema'
import type { TableColumnMeta, TablePageSize, TableRowsSearchState } from '@tables/tableTypes'

const EMPTY_ROWS: DynamicTableRow[] = []

interface UseTableRowsOptions {
  client: JazzClient | null
  search: TableRowsSearchState & {
    setPage: (page: number) => Promise<void>
    setPageSize: (pageSize: TablePageSize) => Promise<void>
  }
  scopeKey: string | null
  tableName: string | null
  wasmSchema: WasmSchema | null
}

interface UseTableRowsResult {
  columns: TableColumnMeta[]
  error: string | null
  goToNextPage: () => Promise<void>
  goToPreviousPage: () => Promise<void>
  hasNextPage: boolean
  hasPreviousPage: boolean
  isInitialLoading: boolean
  isRefreshing: boolean
  loadedRowCount: number
  page: number
  pageSize: TablePageSize
  resetPage: () => Promise<void>
  rows: DynamicTableRow[]
  setPage: (page: number) => Promise<void>
  setPageSize: (pageSize: TablePageSize) => Promise<void>
}

interface ResolvedRowsState {
  dataScopeKey: string
  hasNextPage: boolean
  manager: JazzClient['manager'] | null
  queryKey: string
  rows: DynamicTableRow[]
}

interface LoadedQueryWindow {
  manager: JazzClient['manager']
  offset: number
  pageSize: TablePageSize
  queryBuilder: ReturnType<typeof buildTableRowsQuery>
  rowCount: number
  scopeKey: string
}

interface RowsWindowProjection {
  hasNextPage: boolean
  isCovered: boolean
  rows: DynamicTableRow[] | undefined
}

function coversRowRange(
  windowOffset: number,
  windowRowCount: number,
  reachedEnd: boolean,
  offset: number,
  pageSize: TablePageSize,
): boolean {
  if (offset < windowOffset) return false

  return reachedEnd === true || offset + pageSize < windowOffset + windowRowCount
}

function coversRequestedPage(
  window: LoadedQueryWindow,
  manager: JazzClient['manager'] | null,
  scopeKey: string,
  offset: number,
  pageSize: TablePageSize,
): boolean {
  if (window.manager !== manager || window.scopeKey !== scopeKey || offset < window.offset) {
    return false
  }

  return coversRowRange(
    window.offset,
    window.rowCount,
    window.rowCount <= window.pageSize,
    offset,
    pageSize,
  )
}

function projectRowsWindow(
  rows: DynamicTableRow[] | undefined,
  windowOffset: number,
  windowPageSize: TablePageSize,
  requestedOffset: number,
  requestedPageSize: TablePageSize,
): RowsWindowProjection {
  if (rows === undefined) {
    return { hasNextPage: false, isCovered: false, rows: undefined }
  }

  const relativeOffset = requestedOffset - windowOffset
  const isCovered = coversRowRange(
    windowOffset,
    rows.length,
    rows.length <= windowPageSize,
    requestedOffset,
    requestedPageSize,
  )

  if (isCovered === false) {
    return { hasNextPage: false, isCovered, rows: undefined }
  }

  return {
    hasNextPage: rows.length > relativeOffset + requestedPageSize,
    isCovered,
    rows: rows.slice(relativeOffset, relativeOffset + requestedPageSize),
  }
}

/**
 * Provides columns, rows, and page controls for one Inspector table.
 *
 * The hook derives columns from stored Jazz runtime schema metadata and builds a generic
 * query from URL-backed filters and sorting, avoiding inspected-app generated code.
 */
export function useTableRows({
  client,
  search,
  scopeKey,
  tableName,
  wasmSchema,
}: UseTableRowsOptions): UseTableRowsResult {
  const { filters, page, pageSize, setPage, setPageSize, sortColumn, sortDirection } = search
  // Each key names the smallest boundary allowed to preserve rows or reuse a loaded query window.
  const baseScopeKey = JSON.stringify({ filters, scopeKey, tableName })
  const dataScopeKey = JSON.stringify([baseScopeKey, page, pageSize])
  const queryScopeKey = JSON.stringify([baseScopeKey, sortColumn, sortDirection])
  const queryKey = JSON.stringify([dataScopeKey, sortColumn, sortDirection])
  const requestedOffset = (page - 1) * pageSize

  const schemaColumns = useMemo(
    () => getTableColumns(wasmSchema, tableName),
    [tableName, wasmSchema],
  )

  const columns = useMemo<TableColumnMeta[]>(() => {
    const idColumn: TableColumnMeta = {
      id: 'id',
      label: 'id',
      accessorKey: 'id',
      column: null,
      isSortable: true,
    }

    return [
      idColumn,
      ...schemaColumns.map((column) => ({
        id: column.name,
        label: column.name,
        accessorKey: column.name,
        column,
        isSortable: isTableColumnSortable(column.column_type),
      })),
    ]
  }, [schemaColumns])

  const requestedQueryBuilder = useMemo(() => {
    if (wasmSchema === null || tableName === null) {
      return null
    }

    return buildTableRowsQuery({
      filters,
      page,
      pageSize,
      schema: wasmSchema,
      sortColumn,
      sortDirection,
      tableName,
    })
  }, [filters, page, pageSize, sortColumn, sortDirection, tableName, wasmSchema])

  const manager = client?.manager ?? null
  const [loadedQueryWindow, setLoadedQueryWindow] = useState<LoadedQueryWindow | null>(null)
  const canReuseLoadedWindow =
    loadedQueryWindow !== null &&
    coversRequestedPage(loadedQueryWindow, manager, queryScopeKey, requestedOffset, pageSize)
  const activeQueryBuilder =
    canReuseLoadedWindow === true ? loadedQueryWindow.queryBuilder : requestedQueryBuilder
  const activeQueryOffset =
    canReuseLoadedWindow === true ? loadedQueryWindow.offset : requestedOffset
  const activeQueryPageSize = canReuseLoadedWindow === true ? loadedQueryWindow.pageSize : pageSize

  const queryState = useJazzQueryState<DynamicTableRow>(
    manager,
    activeQueryBuilder ?? undefined,
    INSPECTOR_QUERY_OPTIONS,
  )
  const rows = queryState.data
  const fulfilledQueryRowCount = queryState.status === 'fulfilled' ? queryState.data.length : null
  useLayoutEffect(() => {
    if (fulfilledQueryRowCount === null || manager === null || activeQueryBuilder === null) {
      return
    }

    setLoadedQueryWindow({
      manager,
      offset: activeQueryOffset,
      pageSize: activeQueryPageSize,
      queryBuilder: activeQueryBuilder,
      rowCount: fulfilledQueryRowCount,
      scopeKey: queryScopeKey,
    })
  }, [
    activeQueryBuilder,
    activeQueryOffset,
    activeQueryPageSize,
    fulfilledQueryRowCount,
    manager,
    queryScopeKey,
  ])
  const rowsWindowProjection = useMemo(
    () =>
      projectRowsWindow(rows, activeQueryOffset, activeQueryPageSize, requestedOffset, pageSize),
    [activeQueryOffset, activeQueryPageSize, pageSize, requestedOffset, rows],
  )
  const fulfilledRows = rowsWindowProjection.rows
  const fulfilledHasNextPage = rowsWindowProjection.hasNextPage
  // Sort refreshes may preserve rows; data-scope or manager changes and same-query resets may not.
  const resolvedRowsRef = useRef<ResolvedRowsState | null>(null)
  useLayoutEffect(() => {
    if (fulfilledRows === undefined) return

    resolvedRowsRef.current = {
      dataScopeKey,
      hasNextPage: fulfilledHasNextPage,
      manager,
      queryKey,
      rows: fulfilledRows,
    }
  }, [dataScopeKey, fulfilledHasNextPage, fulfilledRows, manager, queryKey])
  const previousRowsState = resolvedRowsRef.current
  const canPreserveRows =
    queryState.status === 'pending' &&
    previousRowsState?.dataScopeKey === dataScopeKey &&
    previousRowsState.manager === manager &&
    previousRowsState.queryKey !== queryKey
  const visibleRows =
    fulfilledRows ?? (canPreserveRows === true ? previousRowsState.rows : EMPTY_ROWS)
  const hasNextPage =
    fulfilledRows !== undefined
      ? fulfilledHasNextPage
      : canPreserveRows === true
        ? previousRowsState.hasNextPage
        : false
  const isPending = queryState.status === 'pending'
  const isRuntimeReady = client !== null && wasmSchema !== null
  const isInitialLoading =
    isRuntimeReady === false || (isPending === true && canPreserveRows === false)
  const isRefreshing = isPending === true && canPreserveRows === true
  const outOfRangePageKey =
    queryState.status === 'fulfilled' &&
    rowsWindowProjection.isCovered === true &&
    visibleRows.length === 0 &&
    page > 1
      ? queryKey
      : null
  const resetPageKeyRef = useRef<string | null>(null)
  // Query state schedules correction; the latest router command should not make the effect reactive.
  const resetPage = useEffectEvent(() => setPage(1))
  useEffect(() => {
    if (outOfRangePageKey === null) {
      resetPageKeyRef.current = null
      return
    }
    if (resetPageKeyRef.current === outOfRangePageKey) {
      return
    }

    resetPageKeyRef.current = outOfRangePageKey
    void resetPage()
  }, [outOfRangePageKey])

  return {
    columns,
    error:
      queryState.status === 'rejected'
        ? queryState.error instanceof Error
          ? queryState.error.message
          : String(queryState.error)
        : null,
    rows: visibleRows,
    loadedRowCount: visibleRows.length,
    page,
    pageSize,
    hasNextPage,
    hasPreviousPage: page > 1,
    isInitialLoading,
    isRefreshing,
    goToNextPage: async () => {
      if (hasNextPage === true) await setPage(page + 1)
    },
    goToPreviousPage: async () => {
      if (page > 1) await setPage(page - 1)
    },
    resetPage: async () => setPage(1),
    setPage,
    setPageSize,
  }
}
