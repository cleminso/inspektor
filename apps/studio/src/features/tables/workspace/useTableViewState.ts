/**
 * Orchestrates the table query, selection, detail panes, row mutations, and draft transitions.
 *
 * URL search state owns query scope. Local React state owns selection and pane presentation. The
 * table mutation provider owns edit drafts. This hook connects those systems without duplicating
 * parsing, dirty comparison, or Jazz mutation rules.
 */
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { toasts, type DataGridCellTarget, type DataGridFocusRequest } from '@inspektor/ds'
import type { CellSelectionState } from '@tanstack/react-table'
import type { ColumnDescriptor } from 'jazz-tools'

import {
  useRuntimeClient,
  useRuntimeQueryRecovery,
  useRuntimeSchema,
} from '@app/providers/inspectorProvider'
import { moveColumnInOrder, type ColumnMoveDirection } from '@tables/grid/useColumnOrder'
import { useTablePreferences } from '@tables/grid/useTablePreferences'
import { useTableGrid } from '@tables/grid/useTableGrid'
import type { TableFilterClause } from '@tables/filters/tableFilters'
import { useTableRows } from '@tables/query/useTableRows'
import { useTableRowById } from '@tables/query/useTableRowById'
import { focusRowEditorField } from '@tables/rowEditor/fieldFocus'
import { useTableMutationExecutor } from '@tables/rowEditor/mutation/useTableMutation'
import { areMutationValuesEqual } from '@tables/rowEditor/mutation/draft'
import { useTableExplorerSearchParams } from '@tables/routing/useTableSearchParams'
import { useTableNavigationPreparation } from '@tables/routing/tableNavigationPreparation'
import { resolveTableSortColumn } from '@tables/query/tableRowsQuery'
import type {
  DynamicTableRow,
  TableFieldsByRowId,
  TableRowId,
  TableValuesByRowId,
  TableRowsSearchState,
  TablePageSize,
} from '@tables/tableTypes'
import { getNearestSelectedRowId } from '@tables/grid/rowSelectionFocus'
import {
  getInlineFieldRoute,
  resolveSpreadsheetCompletionTarget,
  type SpreadsheetCompletionDirection,
} from '@tables/grid/inlineEditing'

interface UseTableViewStateOptions {
  disabledRowIds?: ReadonlySet<TableRowId>
  onUndoRowDeletions?: (rowIds: readonly TableRowId[]) => void
  retainDisabledRows?: boolean
  schemaColumns: ColumnDescriptor[]
  stagedValuesByRowId?: TableValuesByRowId
  tableKey: string
  tableName: string
}

const emptyDisabledRowIds: ReadonlySet<TableRowId> = new Set()
const emptyRecentlyAppliedCells: TableFieldsByRowId = {}
const emptyRecentlyInsertedRowIds: ReadonlySet<TableRowId> = new Set()
const emptyStagedValuesByRowId: TableValuesByRowId = {}

const recentChangeStatusDuration = 1200
const recentlyAppliedTimerKey = Symbol('recentlyApplied')

interface InsertRowSaveOptions {
  keepOpen: boolean
}

type DetailPaneState =
  | { mode: 'closed' }
  | { mode: 'insert' }
  | { mode: 'rows'; activeRowId: TableRowId }

type PendingPageRowNavigation = {
  edge: 'first' | 'last'
  page: number
}

/**
 * Builds the state and actions consumed by `TableView` for one runtime-selected Jazz table.
 *
 * Row target changes only change the visible projection. Provider-owned pending changes remain in
 * the mounted table state until Apply or Discard resolves them.
 */
export function useTableViewState({
  disabledRowIds = emptyDisabledRowIds,
  onUndoRowDeletions,
  retainDisabledRows = false,
  schemaColumns,
  stagedValuesByRowId = emptyStagedValuesByRowId,
  tableKey,
  tableName,
}: UseTableViewStateOptions) {
  const client = useRuntimeClient()
  const queryRecovery = useRuntimeQueryRecovery()
  const wasmSchema = useRuntimeSchema()
  const { pendingTableName, prepare } = useTableNavigationPreparation()
  const searchState = useTableExplorerSearchParams()
  const sortColumn =
    wasmSchema === null
      ? searchState.sortColumn
      : resolveTableSortColumn(schemaColumns, searchState.sortColumn)
  const sortDirection = sortColumn === searchState.sortColumn ? searchState.sortDirection : 'asc'
  const isPageNavigationPending = pendingTableName !== null
  const runPreparedPageNavigation = useCallback(
    async (
      destination: TableRowsSearchState,
      commit: () => Promise<void>,
      options: {
        errorMessage: string
        policy: 'ignore' | 'replace'
        requireCommit?: boolean
      },
    ): Promise<void> => {
      let result: Awaited<ReturnType<typeof prepare>>
      try {
        result = await prepare({ policy: options.policy, search: destination, tableName }, commit)
      } catch (error) {
        toasts.error(options.errorMessage)
        if (options.requireCommit === true) throw error
        return
      }
      if (options.requireCommit === true && result === 'unavailable') {
        throw new Error('Filters were not applied.')
      }
    },
    [prepare, tableName],
  )
  const setPage = useCallback(
    async (page: number) =>
      runPreparedPageNavigation(
        {
          filters: searchState.filters,
          page,
          pageSize: searchState.pageSize,
          sortColumn,
          sortDirection,
        },
        () => searchState.setPage(page),
        { errorMessage: "Couldn't load page", policy: 'ignore' },
      ),
    [runPreparedPageNavigation, searchState, sortColumn, sortDirection],
  )
  const setPageSize = useCallback(
    async (pageSize: TablePageSize) =>
      runPreparedPageNavigation(
        {
          filters: searchState.filters,
          page: 1,
          pageSize,
          sortColumn,
          sortDirection,
        },
        () => searchState.setPageSize(pageSize),
        { errorMessage: "Couldn't change page size", policy: 'replace' },
      ),
    [runPreparedPageNavigation, searchState, sortColumn, sortDirection],
  )
  const setFilters = useCallback(
    async (filters: TableFilterClause[]) =>
      runPreparedPageNavigation(
        {
          filters,
          page: 1,
          pageSize: searchState.pageSize,
          sortColumn,
          sortDirection,
        },
        () => searchState.setFilters(filters),
        { errorMessage: "Couldn't apply filters", policy: 'replace', requireCommit: true },
      ),
    [runPreparedPageNavigation, searchState, sortColumn, sortDirection],
  )
  const setSorting = useCallback(
    async (nextSortColumn: string, nextSortDirection: 'asc' | 'desc') =>
      runPreparedPageNavigation(
        {
          filters: searchState.filters,
          page: 1,
          pageSize: searchState.pageSize,
          sortColumn: nextSortColumn,
          sortDirection: nextSortDirection,
        },
        () => searchState.setSorting(nextSortColumn, nextSortDirection),
        { errorMessage: "Couldn't change sorting", policy: 'replace' },
      ),
    [runPreparedPageNavigation, searchState],
  )
  // Sort values schedule canonicalization; router command identity is not part of that condition.
  const setCanonicalSorting = useEffectEvent(searchState.setSorting)
  const query = useTableRows({
    client,
    onPageOutOfRange: () => setPage(1),
    onQueryStateChange: queryRecovery.observe,
    onRowsAdded: handleRowsAdded,
    onRowsUpdated: handleRowsUpdated,
    search: {
      filters: searchState.filters,
      page: searchState.page,
      pageSize: searchState.pageSize,
      sortColumn,
      sortDirection,
    },
    schemaColumns,
    scopeKey: tableKey,
    tableName,
    wasmSchema,
  })
  const isReconnecting =
    queryRecovery.status === 'recovering' ||
    (queryRecovery.status === 'idle' && query.isRecoverableTransportFailure === true)
  const settledRowsRef = useRef(query.rows)
  useLayoutEffect(() => {
    if (retainDisabledRows === false) {
      settledRowsRef.current = query.rows
    }
  }, [query.rows, retainDisabledRows])
  const rows = useMemo(() => {
    if (retainDisabledRows === false) {
      return query.rows
    }

    const currentRowsById = new Map(query.rows.map((row) => [String(row.id), row]))
    const retainedRows = settledRowsRef.current.flatMap((row) => {
      const rowId = String(row.id)
      const currentRow = currentRowsById.get(rowId)
      if (currentRow !== undefined) {
        currentRowsById.delete(rowId)
        return currentRow
      }
      return disabledRowIds.has(rowId) ? row : []
    })
    return [...retainedRows, ...currentRowsById.values()]
  }, [disabledRowIds, query.rows, retainDisabledRows])
  useEffect(() => {
    if (wasmSchema !== null && sortColumn !== searchState.sortColumn) {
      void setCanonicalSorting(sortColumn, sortDirection)
    }
  }, [searchState.sortColumn, sortColumn, sortDirection, wasmSchema])
  const [detailPane, setDetailPane] = useState<DetailPaneState>({ mode: 'closed' })
  const detailPaneMode = detailPane.mode
  const activeRowId = detailPane.mode === 'rows' ? detailPane.activeRowId : null
  const [cellSelection, setCellSelection] = useState<CellSelectionState>([])
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [activeFieldEditor, setActiveFieldEditor] = useState<{
    rowValues: Record<string, unknown>
    target: DataGridCellTarget
  } | null>(null)
  const activeFieldEditorTarget = activeFieldEditor?.target ?? null
  const [cellFocusRequest, setCellFocusRequest] = useState<DataGridFocusRequest | null>(null)
  const [selectedRowIds, setSelectedRowIds] = useState<TableRowId[]>([])
  const pendingPageRowNavigationRef = useRef<PendingPageRowNavigation | null>(null)
  const [recentlyInsertedRowIds, setRecentlyInsertedRowIds] = useState<ReadonlySet<TableRowId>>(
    emptyRecentlyInsertedRowIds,
  )
  const [recentlyAppliedCells, setRecentlyAppliedCells] =
    useState<TableFieldsByRowId>(emptyRecentlyAppliedCells)
  const recentChangeTimersRef = useRef(
    new Map<TableRowId | typeof recentlyAppliedTimerKey, ReturnType<typeof setTimeout>>(),
  )
  // Local success and the live query can report the same insert; feedback runs once per view.
  const highlightedInsertedRowIdsRef = useRef(new Set<TableRowId>())

  useEffect(() => {
    const timers = recentChangeTimersRef.current
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  const scheduleRecentChangeExpiry = (
    key: TableRowId | typeof recentlyAppliedTimerKey,
    onExpire: () => void,
  ) => {
    const timers = recentChangeTimersRef.current
    clearTimeout(timers.get(key))
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key)
        onExpire()
      }, recentChangeStatusDuration),
    )
  }

  const highlightRecentlyInsertedRow = (rowId: TableRowId) => {
    if (highlightedInsertedRowIdsRef.current.has(rowId) === true) {
      return
    }
    highlightedInsertedRowIdsRef.current.add(rowId)
    setRecentlyInsertedRowIds((currentRowIds) => {
      return new Set([...currentRowIds, rowId])
    })

    scheduleRecentChangeExpiry(rowId, () => {
      setRecentlyInsertedRowIds((currentRowIds) => {
        if (currentRowIds.has(rowId) === false) {
          return currentRowIds
        }

        const nextRowIds = new Set(currentRowIds)
        nextRowIds.delete(rowId)
        return nextRowIds
      })
    })
  }

  function handleRowsAdded(rowIds: readonly TableRowId[]) {
    for (const rowId of rowIds) {
      highlightRecentlyInsertedRow(rowId)
    }
  }

  function handleRowsUpdated(
    updates: readonly { current: DynamicTableRow; previous: DynamicTableRow }[],
  ) {
    const changedFieldsByRowId: Record<TableRowId, ReadonlySet<string>> = {}
    for (const { current, previous } of updates) {
      const changedFields = new Set(
        schemaColumns
          .filter(
            (column) =>
              areMutationValuesEqual(
                column.column_type,
                previous[column.name],
                current[column.name],
              ) === false,
          )
          .map((column) => column.name),
      )
      if (changedFields.size > 0) {
        changedFieldsByRowId[current.id] = changedFields
      }
    }
    highlightRecentlyAppliedCells(changedFieldsByRowId)
  }

  const highlightRecentlyAppliedCells = (appliedUpdateFields: TableFieldsByRowId) => {
    if (Object.keys(appliedUpdateFields).length === 0) {
      return
    }

    setRecentlyAppliedCells(appliedUpdateFields)
    scheduleRecentChangeExpiry(recentlyAppliedTimerKey, () => {
      setRecentlyAppliedCells(emptyRecentlyAppliedCells)
    })
  }
  const mutations = useTableMutationExecutor({ client, tableName, wasmSchema })
  const columnIds = useMemo(() => query.columns.map((column) => column.id), [query.columns])
  const defaultHiddenColumnIds = useMemo(
    () => query.columns.flatMap((column) => (column.isHiddenByDefault === true ? [column.id] : [])),
    [query.columns],
  )
  const tablePreferences = useTablePreferences({
    tableKey,
    columnIds,
    defaultHiddenColumnIds,
  })

  // Filters, sorting, connection, branch, schema, and table define one selection scope.
  const selectionScopeKey = useMemo(
    () =>
      JSON.stringify({
        filters: searchState.filters,
        page: searchState.page,
        pageSize: searchState.pageSize,
        sortColumn,
        sortDirection,
        tableKey,
      }),
    [
      searchState.filters,
      searchState.page,
      searchState.pageSize,
      sortColumn,
      sortDirection,
      tableKey,
    ],
  )
  const selectionScopeRef = useRef(selectionScopeKey)
  const effectiveSelectedRowIds = useMemo(() => {
    if (activeRowId === null) {
      return selectedRowIds
    }

    if (selectedRowIds.includes(activeRowId) === true) {
      return selectedRowIds
    }

    return [activeRowId]
  }, [activeRowId, selectedRowIds])
  const editedRowIds = activeRowId === null ? [] : effectiveSelectedRowIds
  const validRowIds = useMemo(() => rows.map((row) => String(row.id)), [rows])
  const navigablePageRowIds = useMemo(
    () => validRowIds.filter((rowId) => disabledRowIds.has(rowId) === false),
    [disabledRowIds, validRowIds],
  )
  const hasMultipleEditedRows = editedRowIds.length > 1
  const navigationRowIds = hasMultipleEditedRows === true ? editedRowIds : navigablePageRowIds
  const activeNavigationRowIndex = activeRowId === null ? -1 : navigationRowIds.indexOf(activeRowId)
  const visibleSelectedRowIds = useMemo(() => {
    const validRowIdSet = new Set(validRowIds)
    return effectiveSelectedRowIds.filter((rowId) => validRowIdSet.has(rowId) === true)
  }, [effectiveSelectedRowIds, validRowIds])

  const activePageRowIndex = activeRowId === null ? -1 : validRowIds.indexOf(activeRowId)
  const visibleActiveRow = activePageRowIndex < 0 ? null : (rows[activePageRowIndex] ?? null)
  // Keep the edited row available when filtering or pagination removes it from the visible query.
  const activeRowQuery = useTableRowById({
    client,
    rowId: visibleActiveRow === null ? activeRowId : null,
    tableName,
    wasmSchema,
  })
  const activeRowQueryStatus = activeRowQuery.status
  const activeRow = activeRowQuery.row

  /** Keeps the active draft while selected; otherwise opens the requested or first selected row. */
  const openRows = useCallback(
    (nextSelectedRowIds: TableRowId[], nextActiveRowId: TableRowId | null) => {
      pendingPageRowNavigationRef.current = null
      const resolvedActiveRowId =
        nextActiveRowId !== null && nextSelectedRowIds.includes(nextActiveRowId) === true
          ? nextActiveRowId
          : nextSelectedRowIds[0]
      setSelectedRowIds(nextSelectedRowIds)
      setActiveColumnId(null)
      setActiveFieldEditor(null)

      if (resolvedActiveRowId === undefined) {
        setDetailPane({ mode: 'closed' })
        return
      }
      setDetailPane({ mode: 'rows', activeRowId: resolvedActiveRowId })
    },
    [],
  )

  useLayoutEffect(() => {
    if (
      activeRowId === null ||
      visibleActiveRow !== null ||
      activeRowQueryStatus !== 'fulfilled' ||
      activeRow !== null
    ) {
      return
    }
    const nextSelectedRowIds = selectedRowIds.filter((rowId) => rowId !== activeRowId)
    openRows(
      nextSelectedRowIds,
      getNearestSelectedRowId(validRowIds, nextSelectedRowIds, activeRowId),
    )
  }, [
    activeRow,
    activeRowId,
    activeRowQueryStatus,
    openRows,
    selectedRowIds,
    validRowIds,
    visibleActiveRow,
  ])

  const handleSelectedRowIdsChange = (
    nextSelectedRowIds: TableRowId[],
    intentRowId: TableRowId | null,
  ) => {
    if (intentRowId !== null) {
      const nextActiveRowId =
        nextSelectedRowIds.includes(intentRowId) === true
          ? intentRowId
          : activeRowId !== null &&
              activeRowId !== intentRowId &&
              nextSelectedRowIds.includes(activeRowId) === true
            ? activeRowId
            : getNearestSelectedRowId(validRowIds, nextSelectedRowIds, intentRowId)

      openRows(nextSelectedRowIds, nextActiveRowId)
      return
    }

    const newlySelectedRowId = nextSelectedRowIds.find(
      (rowId) => selectedRowIds.includes(rowId) === false,
    )
    const nextActiveRowId =
      newlySelectedRowId ??
      (activeRowId !== null && nextSelectedRowIds.includes(activeRowId) === true
        ? activeRowId
        : (nextSelectedRowIds[0] ?? null))

    openRows(nextSelectedRowIds, nextActiveRowId)
  }

  const resetSelection = useCallback((nextSelectedRowIds: TableRowId[] = []) => {
    setSelectedRowIds(nextSelectedRowIds)
    setCellSelection([])
    setActiveColumnId(null)
    setActiveFieldEditor(null)
  }, [])

  useLayoutEffect(() => {
    if (selectionScopeRef.current !== selectionScopeKey) {
      selectionScopeRef.current = selectionScopeKey
      resetSelection()
      if (pendingPageRowNavigationRef.current?.page !== searchState.page) {
        pendingPageRowNavigationRef.current = null
        setDetailPane({ mode: 'closed' })
      }
    }
  }, [resetSelection, searchState.page, selectionScopeKey])

  useLayoutEffect(() => {
    const pendingNavigation = pendingPageRowNavigationRef.current
    if (
      pendingNavigation === null ||
      pendingNavigation.page !== searchState.page ||
      query.isInitialLoading === true
    ) {
      return
    }

    const targetRowId =
      pendingNavigation.edge === 'first' ? navigablePageRowIds[0] : navigablePageRowIds.at(-1)
    openRows(targetRowId === undefined ? [] : [targetRowId], targetRowId ?? null)
  }, [navigablePageRowIds, openRows, query.isInitialLoading, searchState.page])

  const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
    void setSorting(columnId, direction)
  }

  const handleColumnVisibilityChange = (nextVisibility: Record<string, boolean>) => {
    tablePreferences.setColumnVisibility(nextVisibility)
    if (activeColumnId !== null && nextVisibility[activeColumnId] === false) {
      setActiveColumnId(null)
    }
  }

  const handleColumnActivate = useCallback((columnId: string | null) => {
    if (columnId !== null) {
      setCellSelection([])
    }
    setActiveColumnId(columnId)
  }, [])
  const setColumnOrder = tablePreferences.setColumnOrder
  const setPinnedColumnIds = tablePreferences.setPinnedColumnIds
  const columnVisibilityRef = useRef(tablePreferences.columnVisibility)
  const pinnedColumnIdsRef = useRef(tablePreferences.pinnedColumnIds)
  // Column-move callbacks stay stable while reading visibility from the committed table state.
  useLayoutEffect(() => {
    columnVisibilityRef.current = tablePreferences.columnVisibility
  }, [tablePreferences.columnVisibility])
  useLayoutEffect(() => {
    pinnedColumnIdsRef.current = tablePreferences.pinnedColumnIds
  }, [tablePreferences.pinnedColumnIds])
  const handleColumnMove = useCallback(
    (columnId: string, direction: ColumnMoveDirection) => {
      if (pinnedColumnIdsRef.current.includes(columnId) === true) {
        setPinnedColumnIds((currentPinnedColumnIds) => {
          const visiblePinnedColumnIds = currentPinnedColumnIds.filter(
            (candidateId) => columnVisibilityRef.current[candidateId] !== false,
          )
          return moveColumnInOrder(
            currentPinnedColumnIds,
            columnId,
            direction,
            visiblePinnedColumnIds,
          )
        })
        return
      }
      setColumnOrder((currentColumnOrder) => {
        const visibleColumnOrder = currentColumnOrder.filter(
          (candidateId) =>
            columnVisibilityRef.current[candidateId] !== false &&
            pinnedColumnIdsRef.current.includes(candidateId) === false,
        )
        return moveColumnInOrder(currentColumnOrder, columnId, direction, visibleColumnOrder)
      })
    },
    [setColumnOrder, setPinnedColumnIds],
  )

  const table = useTableGrid({
    cellSelection,
    columnOrder: tablePreferences.columnOrder,
    pinnedColumnIds: tablePreferences.pinnedColumnIds,
    disabledRowIds,
    rows,
    columns: query.columns,
    sortColumn,
    sortDirection,
    stagedValuesByRowId,
    selectedRowIds: visibleSelectedRowIds,
    columnVisibility: tablePreferences.columnVisibility,
    onSortChange: handleSortChange,
    onUndoRowDeletions,
    onSelectedRowIdsChange: handleSelectedRowIdsChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onCellSelectionChange: setCellSelection,
    onColumnMenuOpen: handleColumnActivate,
    onColumnMove: handleColumnMove,
    onColumnOrderChange: setColumnOrder,
    onPinnedColumnIdsChange: tablePreferences.setPinnedColumnIds,
  })
  const selectedRow = visibleActiveRow ?? activeRow
  const settledActiveRowRef = useRef<{ row: DynamicTableRow; rowId: TableRowId } | null>(null)
  useLayoutEffect(() => {
    if (activeRowId === null) {
      settledActiveRowRef.current = null
    } else if (selectedRow !== null) {
      settledActiveRowRef.current = { row: selectedRow, rowId: activeRowId }
    }
  }, [activeRowId, selectedRow])
  const retainedActiveRow =
    query.isInitialLoading === true && settledActiveRowRef.current?.rowId === activeRowId
      ? settledActiveRowRef.current.row
      : null
  const rowValues = useMemo(() => {
    if (detailPaneMode === 'insert') {
      return {}
    }

    return selectedRow ?? retainedActiveRow
  }, [detailPaneMode, retainedActiveRow, selectedRow])

  const closeDetailPane = () => {
    pendingPageRowNavigationRef.current = null
    setDetailPane({ mode: 'closed' })
  }

  const closeRowEditor = () => {
    setSelectedRowIds([])
    closeDetailPane()
  }

  const requestCellFocus = (target: DataGridCellTarget) => {
    setCellFocusRequest((current) => ({
      requestId: (typeof current?.requestId === 'number' ? current.requestId : 0) + 1,
      target,
    }))
  }

  const handleEscape = () => {
    if (activeFieldEditorTarget !== null) {
      setActiveFieldEditor(null)
      requestCellFocus(activeFieldEditorTarget)
      return
    }
    if (detailPaneMode !== 'closed') {
      closeRowEditor()
      return
    }

    setCellSelection([])
    setActiveColumnId(null)
  }

  const openInsert = () => {
    pendingPageRowNavigationRef.current = null
    resetSelection()
    setDetailPane({ mode: 'insert' })
  }

  const handleInsertSave = async (
    values: Record<string, unknown>,
    options: InsertRowSaveOptions,
  ) => {
    const insertedRowId = await mutations.insertRow(values)
    highlightRecentlyInsertedRow(insertedRowId)
    if (options.keepOpen === true) {
      return
    }
    void setPage(1)
    closeDetailPane()
  }

  const handleMutationApplySuccess = () => {
    if (detailPaneMode === 'insert') {
      return
    }
    resetSelection()
    closeDetailPane()
  }

  const handleRowsStagedForDeletion = (rowIds: readonly TableRowId[]) => {
    const deletedRowIds = new Set(rowIds)
    setSelectedRowIds((currentRowIds) =>
      currentRowIds.filter((rowId) => deletedRowIds.has(rowId) === false),
    )
    setCellSelection([])
    setActiveColumnId(null)
    setActiveFieldEditor(null)
    closeDetailPane()
  }

  const goToRowIndex = (nextActiveRowIndex: number) => {
    const nextActiveRowId = editedRowIds[nextActiveRowIndex] ?? null
    if (nextActiveRowId === null) {
      return
    }

    setDetailPane({ mode: 'rows', activeRowId: nextActiveRowId })
  }

  const goToPageEdge = (page: number, edge: PendingPageRowNavigation['edge']) => {
    void runPreparedPageNavigation(
      {
        filters: searchState.filters,
        page,
        pageSize: searchState.pageSize,
        sortColumn,
        sortDirection,
      },
      () => {
        pendingPageRowNavigationRef.current = { edge, page }
        return searchState.setPage(page)
      },
      { errorMessage: "Couldn't load page", policy: 'ignore' },
    )
  }

  const goToPreviousRow = () => {
    if (hasMultipleEditedRows === true) {
      goToRowIndex(Math.max(activeNavigationRowIndex - 1, 0))
      return
    }
    if (activeNavigationRowIndex > 0) {
      const previousRowId = navigablePageRowIds[activeNavigationRowIndex - 1]
      openRows(previousRowId === undefined ? [] : [previousRowId], previousRowId ?? null)
      return
    }
    if (searchState.page > 1) {
      goToPageEdge(searchState.page - 1, 'last')
    }
  }

  const goToNextRow = () => {
    if (hasMultipleEditedRows === true) {
      goToRowIndex(Math.min(activeNavigationRowIndex + 1, editedRowIds.length - 1))
      return
    }
    const nextRowId = navigablePageRowIds[activeNavigationRowIndex + 1]
    if (nextRowId !== undefined) {
      openRows([nextRowId], nextRowId)
      return
    }
    if (query.hasNextPage === true) {
      goToPageEdge(searchState.page + 1, 'first')
    }
  }

  const canNavigatePrevious =
    activeNavigationRowIndex > 0 ||
    (hasMultipleEditedRows === false && activeNavigationRowIndex === 0 && searchState.page > 1)
  const canNavigateNext =
    activeNavigationRowIndex >= 0 &&
    (activeNavigationRowIndex < navigationRowIds.length - 1 ||
      (hasMultipleEditedRows === false && query.hasNextPage === true))
  const lastLoadedRowNumber = (searchState.page - 1) * searchState.pageSize + rows.length
  const navigationLabel =
    activeRowId === null || activeNavigationRowIndex < 0
      ? null
      : hasMultipleEditedRows === true
        ? `${activeNavigationRowIndex + 1} / ${editedRowIds.length} selected`
        : `${(searchState.page - 1) * searchState.pageSize + activePageRowIndex + 1} / ${
            query.hasNextPage === true ? `${lastLoadedRowNumber + 1}+` : lastLoadedRowNumber
          }`

  const handleFieldEditorCancel = () => {
    if (activeFieldEditorTarget === null) {
      return
    }
    setActiveFieldEditor(null)
    requestCellFocus(activeFieldEditorTarget)
  }

  const handleFieldEditorComplete = (direction: SpreadsheetCompletionDirection) => {
    if (activeFieldEditorTarget === null) {
      return
    }
    const focusableRows = table.getRowModel().rows.map((row) =>
      row
        .getVisibleCells()
        .filter((cell) => cell.getCanSelect() === true)
        .map((cell) => ({ columnId: cell.column.id, rowId: row.id })),
    )
    const target = resolveSpreadsheetCompletionTarget(
      focusableRows,
      activeFieldEditorTarget,
      direction,
    )
    setActiveFieldEditor(null)
    requestCellFocus(target)
  }

  return {
    activeColumnId,
    activeFieldEditorTarget,
    activeFieldEditorRowValues: activeFieldEditor?.rowValues ?? null,
    canInspectSchema: wasmSchema !== null,
    canMutateRows: client !== null && wasmSchema !== null,
    canOpenRowEditor: wasmSchema !== null,
    cellFocusRequest,
    reorderableColumnIds: columnIds,
    recentlyAppliedCells,
    recentlyInsertedRowIds,
    detailPaneMode,
    error: isReconnecting === true ? null : query.error,
    table,
    rows,
    mutationExecutor: mutations,
    page: searchState.page,
    pageSize: searchState.pageSize,
    hasNextPage: query.hasNextPage,
    hasCellSelection: cellSelection.length > 0,
    isInitialLoading: query.isInitialLoading || isReconnecting,
    isPageNavigationPending,
    isReconnecting,
    isRefreshing: query.isRefreshing,
    scrollResetKey: selectionScopeKey,
    setPage,
    setPageSize,
    filters: searchState.filters,
    setFilters,
    tableColumns: query.columns,
    rowValues,
    rowEditorQueryError: activeRowQueryStatus === 'rejected' ? activeRowQuery.error : null,
    rowEditorQueryLoading:
      activeRowId !== null && visibleActiveRow === null && activeRowQueryStatus === 'pending',
    rowEditor: {
      activeRowId,
      canNavigateNext,
      canNavigatePrevious,
      editedRowIds,
      goToNextRow,
      goToPreviousRow,
      navigationLabel,
      openInsert,
    },
    handleCellActivate: (target: DataGridCellTarget) => {
      setActiveColumnId(null)
      if (detailPaneMode === 'rows' && target.rowId === activeRowId) {
        requestAnimationFrame(() => {
          focusRowEditorField(target.columnId)
        })
      }
    },
    handleCellEditRequest: (target: DataGridCellTarget) => {
      if (detailPaneMode !== 'closed') {
        return
      }
      const columnMeta = query.columns.find((column) => column.id === target.columnId)
      if (columnMeta === undefined) {
        return
      }
      const route = getInlineFieldRoute(columnMeta)
      if (route === 'rowPane') {
        const nextSelectedRowIds = effectiveSelectedRowIds.includes(target.rowId)
          ? effectiveSelectedRowIds
          : [...effectiveSelectedRowIds, target.rowId]
        openRows(nextSelectedRowIds, target.rowId)
        requestAnimationFrame(() => {
          focusRowEditorField(target.columnId)
        })
        return
      }
      if (route !== 'fieldEditor') {
        return
      }
      setActiveColumnId(null)
      const row = rows.find((candidate) => String(candidate.id) === target.rowId)
      if (row !== undefined) {
        setActiveFieldEditor({ rowValues: { ...row }, target })
      }
    },
    handleEscape,
    handleColumnActivate,
    handleFieldEditorCancel,
    handleFieldEditorComplete,
    handleInsertSave,
    handleMutationApplySuccess,
    handleMutationUpdatesApplied: highlightRecentlyAppliedCells,
    handleRowsStagedForDeletion,
    closeRowEditor,
  }
}
