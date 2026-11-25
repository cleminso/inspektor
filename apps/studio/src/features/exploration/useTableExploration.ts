import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'
import { toasts } from '@inspektor/ds'
import { useRouterState } from '@tanstack/react-router'
import type { ColumnDescriptor, WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import {
  isTableColumnSortable,
  resolveTableSortColumn,
  type TableQueryIntent,
} from '@inspektor/core/query'
import { useExploration, useExplorationState, type StudioExploration } from './provider'
import { TABLE_QUERY_FAILURE_MESSAGE } from '@tables/query/jazzQueryError'
import { useTableExplorerSearchParams } from '@tables/routing/useTableSearchParams'
import { TABLE_PROVENANCE_COLUMNS } from '@tables/tableProvenance'
import type {
  DynamicTableRow,
  TableColumnMeta,
  TablePageSize,
  TableRowsSearchState,
} from '@tables/tableTypes'
import type { TableFilterClause } from '@tables/filters/tableFilters'

type QueryChange = Parameters<StudioExploration['refine']>[0]['change']

/** React supplies accepted URL intent and presentation ports to one exploration workflow. */
export function useTableExploration({
  client,
  schema,
  schemaColumns,
  scopeKey,
  tableName,
  onRowsAdded,
  onRowsUpdated,
}: {
  client: JazzClient | null
  schema: WasmSchema | null
  schemaColumns: readonly ColumnDescriptor[]
  scopeKey: string
  tableName: string
  onRowsAdded?: (rowIds: readonly string[]) => void
  onRowsUpdated?: (rows: readonly { current: DynamicTableRow; previous: DynamicTableRow }[]) => void
}) {
  const exploration = useExploration()
  const origin = useRouterState({ select: (state) => state.location.href })
  const managerState = useExplorationState()
  const searchState = useTableExplorerSearchParams()
  const { filters, page, pageSize } = searchState
  const sortColumn =
    schema === null
      ? searchState.sortColumn
      : resolveTableSortColumn(schemaColumns, searchState.sortColumn)
  const sortDirection = sortColumn === searchState.sortColumn ? searchState.sortDirection : 'asc'
  const intent = useMemo<TableQueryIntent>(
    () => ({ tableName, filters, page, pageSize, sortColumn, sortDirection }),
    [filters, page, pageSize, sortColumn, sortDirection, tableName],
  )
  const commit = searchState.commitQuery
  const refine = useCallback(
    async (change: QueryChange, errorMessage: string, requireCommit = false) => {
      try {
        const result = await exploration.refine({ current: intent, change, commit })
        if (requireCommit === true && result === 'unavailable') {
          throw new Error('Filters were not applied.')
        }
      } catch (error) {
        toasts.error(errorMessage)
        if (requireCommit === true) throw error
      }
    },
    [commit, exploration, intent],
  )
  const setPage = useCallback(
    (nextPage: number) => refine({ type: 'page', page: nextPage }, "Couldn't load page"),
    [refine],
  )
  const setPageSize = useCallback(
    (nextPageSize: TablePageSize) =>
      refine({ type: 'pageSize', pageSize: nextPageSize }, "Couldn't change page size"),
    [refine],
  )
  const setFilters = useCallback(
    (nextFilters: TableFilterClause[]) =>
      refine({ type: 'filters', filters: nextFilters }, "Couldn't apply filters", true),
    [refine],
  )
  const setSorting = useCallback(
    (column: string, direction: 'asc' | 'desc') =>
      refine(
        { type: 'sort', sortColumn: column, sortDirection: direction },
        "Couldn't change sorting",
      ),
    [refine],
  )
  const runPreparedPageNavigation = useCallback(
    async (
      destination: TableRowsSearchState,
      commitDestination: () => Promise<void>,
      options: { errorMessage: string; policy: 'ignore' | 'replace' },
    ) => {
      try {
        await exploration.navigate({
          intent: { ...destination, tableName },
          policy: options.policy,
          commit: commitDestination,
        })
      } catch {
        toasts.error(options.errorMessage)
      }
    },
    [exploration, tableName],
  )

  const ports = useRef({ onRowsAdded, onRowsUpdated, setPage })
  useLayoutEffect(() => {
    ports.current = { onRowsAdded, onRowsUpdated, setPage }
  })
  const view = useMemo(() => exploration.createView(), [exploration])
  const query = useMemo(
    () =>
      view.query({
        client,
        schema,
        scopeKey,
        origin,
        intent,
        onPageOutOfRange: () => {
          void ports.current.setPage(1)
        },
        onRowsAdded: (ids) => ports.current.onRowsAdded?.(ids),
        onRowsUpdated: (updates) => ports.current.onRowsUpdated?.(updates),
      }),
    [client, intent, origin, schema, scopeKey, view],
  )
  const result = useSyncExternalStore(query.subscribe, query.getSnapshot, query.getSnapshot)
  const rows = useMemo(() => [...result.rows], [result.rows])
  const columns = useMemo<TableColumnMeta[]>(
    () => [
      { id: 'id', label: 'id', accessorKey: 'id', column: null, isSortable: true },
      ...schemaColumns.map((column) => ({
        id: column.name,
        label: column.name,
        accessorKey: column.name,
        column,
        isSortable: isTableColumnSortable(column.column_type),
      })),
      ...TABLE_PROVENANCE_COLUMNS.map((column): TableColumnMeta => {
        const metadata: TableColumnMeta = {
          id: column.name,
          label: column.name,
          accessorKey: column.name,
          column,
          isReadOnly: true,
          isSortable: column.name === '$createdAt' || column.name === '$updatedAt',
        }
        if (column.name === '$createdBy' || column.name === '$updatedBy') {
          metadata.isHiddenByDefault = true
        }
        return metadata
      }),
    ],
    [schemaColumns],
  )
  const canonicalize = useEffectEvent(() => commit({ ...intent, page: 1 }))
  useEffect(() => {
    if (schema !== null && sortColumn !== searchState.sortColumn) void canonicalize()
  }, [schema, searchState.sortColumn, sortColumn])

  const isReconnecting =
    managerState.recoveryStatus === 'recovering' ||
    (managerState.recoveryStatus === 'idle' && result.isRecoverableTransportFailure === true)
  const isPageNavigationPending = managerState.pendingTableName !== null
  const isDiagnosisPending = isPageNavigationPending === true && result.error !== null
  return {
    searchState,
    sortColumn,
    sortDirection,
    columns,
    rows,
    hasNextPage: result.hasNextPage,
    error:
      isReconnecting === false && isDiagnosisPending === false && result.status === 'rejected'
        ? TABLE_QUERY_FAILURE_MESSAGE
        : null,
    isInitialLoading:
      client === null ||
      schema === null ||
      result.isInitialLoading ||
      isReconnecting ||
      isDiagnosisPending,
    isRefreshing: result.isRefreshing,
    isPageNavigationPending,
    isReconnecting,
    setPage,
    setPageSize,
    setFilters,
    setSorting,
    runPreparedPageNavigation,
  }
}
