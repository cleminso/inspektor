/**
 * Runs schema-driven table queries for the Inspektor data explorer.
 *
 * The hook turns route search state into a generic Jazz query, derives render columns from
 * stored schema metadata, and loads one URL-backed page without app-generated table types.
 */
import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { type ColumnDescriptor, type WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import { RowChangeKind } from 'jazz-tools/shared'
import { projectTableResult, type SettledTablePage } from '@inspektor/core/query'

import { INSPEKTOR_QUERY_OPTIONS } from '@tables/query/queryOptions'
import {
  isRecoverableJazzTransportError,
  TABLE_QUERY_FAILURE_MESSAGE,
} from '@tables/query/jazzQueryError'
import { prefetchJazzQuery } from '@tables/query/prefetchJazzQuery'
import { buildTableRowsQuery, isTableColumnSortable } from '@tables/query/tableRowsQuery'
import { useJazzQueryState } from '@tables/query/useJazzQueryState'
import { TABLE_PROVENANCE_COLUMNS } from '@tables/tableProvenance'
import type { DynamicTableRow, TableColumnMeta, TableRowsSearchState } from '@tables/tableTypes'

const EMPTY_ROWS: DynamicTableRow[] = []
// Provenance is absent from stored schema descriptors, so the grid supplies read-only metadata
// that matches the values returned by the explicit provenance projection.
const PROVENANCE_COLUMNS = TABLE_PROVENANCE_COLUMNS.map((descriptor): TableColumnMeta => {
  const { name } = descriptor
  const column: TableColumnMeta = {
    id: name,
    label: name,
    accessorKey: name,
    column: descriptor,
    isReadOnly: true,
    isSortable: name === '$createdAt' || name === '$updatedAt',
  }
  if (name === '$createdBy' || name === '$updatedBy') {
    column.isHiddenByDefault = true
  }
  return column
})

interface UseTableRowsOptions {
  client: JazzClient | null
  onPageOutOfRange: () => void
  onQueryStateChange?: (observation: TableRowsQueryObservation) => void
  onRowsAdded?: (rowIds: readonly string[]) => void
  onRowsUpdated?: (
    updates: readonly { current: DynamicTableRow; previous: DynamicTableRow }[],
  ) => void
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
  isRecoverableTransportFailure: boolean
  isRefreshing: boolean
  rows: DynamicTableRow[]
}

type TableRowsQueryObservation =
  | {
      client: JazzClient
      status: 'fulfilled'
    }
  | {
      client: JazzClient
      recoverableTransportFailure: boolean
      status: 'rejected'
    }

/** Distinguishes post-mount inserts from existing rows entering a local-first query result. */
function wasCreatedDuringObservation(row: DynamicTableRow, observationStartedAt: number): boolean {
  const createdAt = row.$createdAt
  if (createdAt instanceof Date === false) {
    return false
  }
  const createdAtTime = createdAt.getTime()
  return Number.isFinite(createdAtTime) && createdAtTime > observationStartedAt
}

/**
 * Provides columns, rows, and page controls for one Inspektor table.
 *
 * The hook derives columns from stored Jazz runtime schema metadata and builds a generic
 * query from URL-backed filters and sorting, avoiding inspected-app generated code.
 */
export function useTableRows({
  client,
  onPageOutOfRange,
  onQueryStateChange,
  onRowsAdded,
  onRowsUpdated,
  search,
  schemaColumns,
  scopeKey,
  tableName,
  wasmSchema,
}: UseTableRowsOptions): UseTableRowsResult {
  const { filters, page, pageSize, sortColumn, sortDirection } = search
  const [observationStartedAt] = useState(() => Date.now())
  const reportedInsertedRowIdsRef = useRef(new Set<string>())
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
      ...PROVENANCE_COLUMNS,
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

  const liveRowsByIdRef = useRef(new Map<string, DynamicTableRow>())
  const queryState = useJazzQueryState<DynamicTableRow>(
    client,
    requestedQueryBuilder ?? undefined,
    INSPEKTOR_QUERY_OPTIONS,
    (delta, snapshot) => {
      const updatedRows = delta.delta.flatMap((change) => {
        if (change.kind !== RowChangeKind.Updated || change.item === undefined) {
          return []
        }
        const previous = liveRowsByIdRef.current.get(change.id)
        return previous === undefined ? [] : [{ current: change.item, previous }]
      })
      const addedRowIds = delta.delta.flatMap((change) => {
        if (
          change.kind !== RowChangeKind.Added ||
          reportedInsertedRowIdsRef.current.has(change.id) === true
        ) {
          return []
        }
        reportedInsertedRowIdsRef.current.add(change.id)
        return wasCreatedDuringObservation(change.item, observationStartedAt) ? [change.id] : []
      })
      if (addedRowIds.length > 0) {
        onRowsAdded?.(addedRowIds)
      }
      if (updatedRows.length > 0) {
        onRowsUpdated?.(updatedRows)
      }
      // Feedback compares complete canonical snapshots. Never reconstruct query rows from deltas.
      liveRowsByIdRef.current = new Map(
        (snapshot.data ?? []).slice(0, pageSize).map((row) => [row.id, row]),
      )
    },
  )
  const resolvedRowsRef = useRef<SettledTablePage | undefined>(undefined)
  const result = useMemo(() => {
    if (client === null || wasmSchema === null || queryState.status === 'idle') return null
    return projectTableResult({
      identity: {
        runtime: client,
        schema: wasmSchema,
        scopeKey,
        intent: { ...search, tableName },
        queryKey,
      },
      state: queryState,
      previous: resolvedRowsRef.current,
    })
  }, [client, wasmSchema, scopeKey, search, tableName, queryKey, queryState])
  const fulfilledPage =
    result?.status === 'rows' || result?.status === 'empty' ? result.page : undefined
  const fulfilledRows = fulfilledPage?.rows
  const fulfilledHasNextPage = fulfilledPage?.hasNextPage ?? false
  const prepareNextPage =
    (result?.status === 'rows' || result?.status === 'empty') && result.prepareNextPage === true
  const isRecoverableTransportFailure =
    queryState.status === 'rejected' && isRecoverableJazzTransportError(queryState.error)
  const reportQueryState = useEffectEvent((observation: TableRowsQueryObservation) => {
    onQueryStateChange?.(observation)
  })
  useEffect(() => {
    if (client === null) {
      return
    }
    if (queryState.status === 'fulfilled') {
      reportQueryState({ client, status: 'fulfilled' })
    } else if (queryState.status === 'rejected') {
      reportQueryState({
        client,
        recoverableTransportFailure: isRecoverableTransportFailure,
        status: 'rejected',
      })
    }
  }, [client, isRecoverableTransportFailure, queryKey, queryState.status])
  useEffect(() => {
    if (client === null || wasmSchema === null || prepareNextPage === false) {
      return
    }

    const nextPageQuery = buildTableRowsQuery({
      filters,
      page: page + 1,
      pageSize,
      schema: wasmSchema,
      sortColumn,
      sortDirection,
      tableName,
    })
    const preparation = prefetchJazzQuery(client, nextPageQuery, INSPEKTOR_QUERY_OPTIONS)
    return preparation.release
  }, [
    client,
    filters,
    fulfilledHasNextPage,
    page,
    pageSize,
    queryState.status,
    prepareNextPage,
    scopeKey,
    sortColumn,
    sortDirection,
    tableName,
    wasmSchema,
  ])
  useLayoutEffect(() => {
    liveRowsByIdRef.current = new Map((fulfilledRows ?? []).map((row) => [row.id, row]))
  }, [fulfilledRows, queryKey])
  useLayoutEffect(() => {
    if (fulfilledPage !== undefined) resolvedRowsRef.current = fulfilledPage
  }, [fulfilledPage])
  const visiblePage = result?.status === 'refreshing' ? result.page : fulfilledPage
  const visibleRows = visiblePage?.rows ?? EMPTY_ROWS
  const hasNextPage = visiblePage?.hasNextPage ?? false
  const isRuntimeReady = client !== null && wasmSchema !== null
  const isInitialLoading = isRuntimeReady === false || result?.status === 'loading'
  const isRefreshing = result?.status === 'refreshing'
  const outOfRangePageKey =
    (result?.status === 'rows' || result?.status === 'empty') && result.correctPage === true
      ? queryKey
      : null
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
    error: queryState.status === 'rejected' ? TABLE_QUERY_FAILURE_MESSAGE : null,
    rows: visibleRows,
    hasNextPage,
    isInitialLoading,
    isRecoverableTransportFailure,
    isRefreshing,
  }
}
