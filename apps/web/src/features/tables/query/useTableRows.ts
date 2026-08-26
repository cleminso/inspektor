/**
 * Runs schema-driven table queries for the Inspector data explorer.
 *
 * The hook turns route search state into a generic Jazz query, derives render columns from
 * stored schema metadata, and loads one URL-backed page without app-generated table types.
 */
import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef } from 'react'

import { type ColumnDescriptor, type DynamicTableRow, type WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'

import { buildTableRowsQuery, isTableColumnSortable } from '@tables/query/tableRowsQuery'
import { INSPECTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'
import { useJazzQueryState } from '@tables/query/useJazzQueryState'
import type { TableColumnMeta, TableRowsSearchState } from '@tables/tableTypes'

const EMPTY_ROWS: DynamicTableRow[] = []

interface UseTableRowsOptions {
  client: JazzClient | null
  onPageOutOfRange: () => void
  search: TableRowsSearchState
  schemaColumns: readonly ColumnDescriptor[]
  scopeKey: string
  tableName: string
  wasmSchema: WasmSchema | null
}

interface UseTableRowsResult {
  columns: TableColumnMeta[]
  error: string | null
  hasNextPage: boolean
  isInitialLoading: boolean
  isRefreshing: boolean
  rows: DynamicTableRow[]
}

interface ResolvedRowsState {
  dataScopeKey: string
  hasNextPage: boolean
  manager: JazzClient['manager'] | null
  queryKey: string
  rows: DynamicTableRow[]
}

/**
 * Provides columns, rows, and page controls for one Inspector table.
 *
 * The hook derives columns from stored Jazz runtime schema metadata and builds a generic
 * query from URL-backed filters and sorting, avoiding inspected-app generated code.
 */
export function useTableRows({
  client,
  onPageOutOfRange,
  search,
  schemaColumns,
  scopeKey,
  tableName,
  wasmSchema,
}: UseTableRowsOptions): UseTableRowsResult {
  const { filters, page, pageSize, sortColumn, sortDirection } = search
  // Sort is intentionally excluded from the data scope so a sort refresh can keep settled rows.
  // Page, page size, filters, table, and runtime scope stay in the key to prevent stale cross-scope data.
  const dataScopeKey = JSON.stringify([{ filters, scopeKey, tableName }, page, pageSize])
  const queryKey = JSON.stringify([dataScopeKey, sortColumn, sortDirection])

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
    if (wasmSchema === null) {
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
  const queryState = useJazzQueryState<DynamicTableRow>(
    manager,
    requestedQueryBuilder ?? undefined,
    INSPECTOR_QUERY_OPTIONS,
  )
  const fulfilledPage = useMemo(() => {
    const rows = queryState.data
    return rows === undefined
      ? undefined
      : { hasNextPage: rows.length > pageSize, rows: rows.slice(0, pageSize) }
  }, [pageSize, queryState.data])
  const fulfilledRows = fulfilledPage?.rows
  const fulfilledHasNextPage = fulfilledPage?.hasNextPage ?? false
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
    queryState.status === 'fulfilled' && visibleRows.length === 0 && page > 1 ? queryKey : null
  const pageCorrectionKeyRef = useRef<string | null>(null)
  // Query state schedules correction; the latest router command should not make the effect reactive.
  const correctOutOfRangePage = useEffectEvent(onPageOutOfRange)
  useEffect(() => {
    if (outOfRangePageKey === null) {
      pageCorrectionKeyRef.current = null
      return
    }
    if (pageCorrectionKeyRef.current === outOfRangePageKey) {
      return
    }

    pageCorrectionKeyRef.current = outOfRangePageKey
    void correctOutOfRangePage()
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
    hasNextPage,
    isInitialLoading,
    isRefreshing,
  }
}
