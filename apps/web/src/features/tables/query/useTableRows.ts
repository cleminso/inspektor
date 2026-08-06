/**
 * Runs schema-driven table queries for the Inspector data explorer.
 *
 * The hook turns route search state into a generic Jazz query, derives render columns from
 * stored schema metadata, and loads one URL-backed page without app-generated table types.
 */
import { useEffect, useMemo, useRef } from 'react'

import { type DynamicTableRow } from 'jazz-tools'

import { useInspector } from '@app/providers/inspectorProvider'
import { buildTableRowsQuery, TABLE_ROWS_QUERY_OPTIONS } from '@tables/query/tableRowsQuery'
import { useJazzQueryState } from '@tables/query/useJazzQueryState'
import { useTableExplorerSearchParams } from '@tables/routing/useTableSearchParams'
import { getTableColumns } from '@tables/schema/tableSchema'
import type { TableColumnMeta, TablePageSize } from '@tables/tableTypes'

const EMPTY_ROWS: DynamicTableRow[] = []

/** Returns whether the generic query builder can sort this Jazz column type. */
function isColumnSortable(
  columnType: ReturnType<typeof getTableColumns>[number]['column_type'],
): boolean {
  switch (columnType.type) {
    case 'Integer':
    case 'BigInt':
    case 'Double':
    case 'Boolean':
    case 'Text':
    case 'Enum':
    case 'Timestamp':
    case 'Uuid':
      return true
    default:
      return false
  }
}

export interface UseTableRowsOptions {
  tableName: string | null
}

export interface UseTableRowsResult {
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
  queryKey: string
  rows: DynamicTableRow[]
}

/**
 * Provides columns, rows, and page controls for one Inspector table.
 *
 * The hook derives columns from stored Jazz runtime schema metadata and builds a generic
 * query from URL-backed filters and sorting, avoiding inspected-app generated code.
 */
export function useTableRows({ tableName }: UseTableRowsOptions): UseTableRowsResult {
  const { currentSchemaHash, runtime } = useInspector()
  const { filters, page, pageSize, setPage, setPageSize, sortColumn, sortDirection } =
    useTableExplorerSearchParams()
  const queryKey = JSON.stringify({
    currentSchemaHash,
    filters,
    page,
    pageSize,
    sortColumn,
    sortDirection,
    tableName,
  })
  const dataScopeKey = JSON.stringify({ currentSchemaHash, filters, page, pageSize, tableName })

  const schemaColumns = useMemo(
    () => getTableColumns(runtime.wasmSchema, tableName),
    [runtime.wasmSchema, tableName],
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
        isSortable: isColumnSortable(column.column_type),
      })),
    ]
  }, [schemaColumns])

  const queryBuilder = useMemo(() => {
    if (runtime.wasmSchema === null || tableName === null) {
      return null
    }

    return buildTableRowsQuery({
      filters,
      page,
      pageSize,
      schema: runtime.wasmSchema,
      sortColumn,
      sortDirection,
      tableName,
    })
  }, [filters, page, pageSize, runtime.wasmSchema, sortColumn, sortDirection, tableName])

  const queryState = useJazzQueryState<DynamicTableRow>(
    queryBuilder ?? undefined,
    TABLE_ROWS_QUERY_OPTIONS,
  )
  const rows = queryState.data
  // Keep compatible rows during sort refreshes and pagination, but never carry them into another
  // table, schema, filter set, page, or page-size scope.
  const resolvedRowsRef = useRef<ResolvedRowsState | null>(null)
  if (rows !== undefined) {
    resolvedRowsRef.current = {
      dataScopeKey,
      queryKey,
      rows,
    }
  }
  const previousRowsState = resolvedRowsRef.current
  const canPreserveRows =
    queryState.status === 'pending' && previousRowsState?.dataScopeKey === dataScopeKey
  const resolvedRows = rows ?? (canPreserveRows === true ? previousRowsState.rows : EMPTY_ROWS)
  const hasNextPage = resolvedRows.length > pageSize
  const visibleRows = useMemo(
    () => (hasNextPage === true ? resolvedRows.slice(0, pageSize) : resolvedRows),
    [hasNextPage, pageSize, resolvedRows],
  )
  const isPending = queryState.status === 'pending'
  const isInitialLoading = isPending === true && canPreserveRows === false
  const isRefreshing =
    isPending === true && canPreserveRows === true && previousRowsState.queryKey !== queryKey
  const outOfRangePageKey =
    queryState.status === 'fulfilled' && queryState.data.length === 0 && page > 1 ? queryKey : null
  const resetPageKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (outOfRangePageKey === null || resetPageKeyRef.current === outOfRangePageKey) {
      return
    }

    resetPageKeyRef.current = outOfRangePageKey
    void setPage(1)
  }, [outOfRangePageKey, setPage])

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
