/**
 * Orchestrates the table query, selection, detail panes, row mutations, and draft transitions.
 *
 * URL search state owns query scope. Local React state owns selection and pane presentation. The
 * table mutation provider owns edit drafts. This hook connects those systems without duplicating
 * parsing, dirty comparison, or Jazz mutation rules.
 */
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'

import type { DataGridCellTarget } from '@inspektor/ds'
import type { ColumnDescriptor } from 'jazz-tools'

import { useRuntimeClient, useRuntimeSchema } from '@app/runtime/runtimeProvider'
import { moveColumnInOrder, type ColumnMoveDirection } from '@tables/grid/useColumnOrder'
import { useTablePreferences } from '@tables/grid/useTablePreferences'
import { useTableGrid } from '@tables/grid/useTableGrid'
import { useTableExploration } from '@exploration/useTableExploration'
import { useTableRowById } from '@tables/query/useTableRowById'
import { useTableChangeFeedback } from '@tables/workspace/useTableChangeFeedback'
import { useTablePaneState } from '@tables/workspace/useTablePaneState'
import type { DynamicTableRow, TableRowId, TableValuesByRowId } from '@tables/tableTypes'
import { getNearestSelectedRowId } from '@tables/grid/rowSelectionFocus'

interface UseTableViewStateOptions {
  requestTransition?: (action: () => void) => void
  disabledRowIds?: ReadonlySet<TableRowId>
  onUndoRowDeletions?: (rowIds: readonly TableRowId[]) => void
  retainDisabledRows?: boolean
  schemaColumns: ColumnDescriptor[]
  draftValuesByRowId?: TableValuesByRowId
  tableKey: string
  tableName: string
}

const emptyDisabledRowIds: ReadonlySet<TableRowId> = new Set()
const emptyDraftValuesByRowId: TableValuesByRowId = {}
const runTransition = (action: () => void) => action()

interface InsertRowSaveOptions {
  keepOpen: boolean
}

/**
 * Builds the state and actions consumed by `TableView` for one runtime-selected Jazz table.
 *
 * Row target changes pass through the pane transition guard before selection changes.
 */
export function useTableViewState({
  requestTransition = runTransition,
  disabledRowIds = emptyDisabledRowIds,
  onUndoRowDeletions,
  retainDisabledRows = false,
  schemaColumns,
  draftValuesByRowId = emptyDraftValuesByRowId,
  tableKey,
  tableName,
}: UseTableViewStateOptions) {
  const client = useRuntimeClient()
  const wasmSchema = useRuntimeSchema()
  const {
    recentlyInsertedRowIds,
    recentlyAppliedCells,
    highlightRecentlyInsertedRow,
    highlightRecentlyAppliedCells,
    handleRowsAdded,
    handleRowsUpdated,
  } = useTableChangeFeedback(schemaColumns)
  const query = useTableExploration({
    client,
    onRowsAdded: handleRowsAdded,
    onRowsUpdated: handleRowsUpdated,
    schemaColumns,
    scopeKey: tableKey,
    tableName,
    schema: wasmSchema,
  })
  const {
    searchState,
    sortColumn,
    sortDirection,
    isPageNavigationPending,
    isReconnecting,
    runPreparedPageNavigation,
    setPage,
    setPageSize,
    setFilters,
    setSorting,
  } = query
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
  const pane = useTablePaneState(requestTransition)
  const {
    detailPane,
    setDetailPane,
    requestedField,
    insertRevision,
    detailPaneMode,
    activeRowId,
    cellSelection,
    setCellSelection,
    activeColumnId,
    setActiveColumnId,
    selectedRowIds,
    pendingPageRowNavigationRef,
    openRows,
    resetSelection,
    closeDetailPane,
    closeRowEditor,
    handleEscape,
    openInsert,
    handleRowDeleteSuccess,
    handleColumnActivate,
  } = pane
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
  const navigationRowIds = navigablePageRowIds
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

  useLayoutEffect(() => {
    if (
      retainDisabledRows === true ||
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
    retainDisabledRows,
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

  useLayoutEffect(() => {
    if (selectionScopeRef.current !== selectionScopeKey) {
      selectionScopeRef.current = selectionScopeKey
      resetSelection()
      if (pendingPageRowNavigationRef.current?.page !== searchState.page) {
        pendingPageRowNavigationRef.current = null
        setDetailPane({ mode: 'closed' })
      }
    }
  }, [
    resetSelection,
    searchState.page,
    selectionScopeKey,
    setDetailPane,
    pendingPageRowNavigationRef,
  ])

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
  }, [
    navigablePageRowIds,
    openRows,
    query.isInitialLoading,
    searchState.page,
    pendingPageRowNavigationRef,
  ])

  const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
    void setSorting(columnId, direction)
  }

  const handleColumnVisibilityChange = (nextVisibility: Record<string, boolean>) => {
    tablePreferences.setColumnVisibility(nextVisibility)
    if (activeColumnId !== null && nextVisibility[activeColumnId] === false) {
      setActiveColumnId(null)
    }
  }

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
    stagedValuesByRowId: draftValuesByRowId,
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
    (query.isInitialLoading === true || retainDisabledRows === true) &&
    settledActiveRowRef.current?.rowId === activeRowId
      ? settledActiveRowRef.current.row
      : null
  const rowValues = useMemo(() => {
    if (detailPaneMode === 'insert') {
      return detailPane.mode === 'insert' ? (detailPane.values ?? {}) : {}
    }

    return selectedRow ?? retainedActiveRow
  }, [detailPane, detailPaneMode, retainedActiveRow, selectedRow])

  const handleInsertSuccess = (insertedRowId: string, options: InsertRowSaveOptions) => {
    highlightRecentlyInsertedRow(insertedRowId)
    if (options.keepOpen === true) {
      return
    }
    void setPage(1)
    closeDetailPane()
  }

  const goToPageEdge = (page: number, edge: 'first' | 'last') => {
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
        return searchState.commitQuery({
          tableName,
          filters: searchState.filters,
          page,
          pageSize: searchState.pageSize,
          sortColumn,
          sortDirection,
        })
      },
      { errorMessage: "Couldn't load page", policy: 'ignore' },
    )
  }

  const goToPreviousRow = () => {
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
    activeNavigationRowIndex > 0 || (activeNavigationRowIndex === 0 && searchState.page > 1)
  const canNavigateNext =
    activeNavigationRowIndex >= 0 &&
    (activeNavigationRowIndex < navigationRowIds.length - 1 || query.hasNextPage === true)
  const lastLoadedRowNumber = (searchState.page - 1) * searchState.pageSize + rows.length
  const navigationLabel =
    activeRowId === null || activeNavigationRowIndex < 0
      ? null
      : `${(searchState.page - 1) * searchState.pageSize + activePageRowIndex + 1} / ${
          query.hasNextPage === true ? `${lastLoadedRowNumber + 1}+` : lastLoadedRowNumber
        }`

  return {
    activeColumnId,
    canInspectSchema: wasmSchema !== null,
    canMutateRows: client !== null && wasmSchema !== null,
    canOpenRowEditor: wasmSchema !== null,
    reorderableColumnIds: columnIds,
    recentlyAppliedCells,
    recentlyInsertedRowIds,
    detailPaneMode,
    insertRevision,
    error: query.error,
    table,
    rows,
    page: searchState.page,
    pageSize: searchState.pageSize,
    hasNextPage: query.hasNextPage,
    hasCellSelection: cellSelection.length > 0,
    isInitialLoading: query.isInitialLoading,
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
    requestedField,
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
    handleCellActivate: pane.handleCellActivate,
    handleCellEditRequest: (target: DataGridCellTarget) =>
      pane.handleCellEditRequest(target, query.columns),
    handleEscape,
    handleColumnActivate,
    handleInsertSuccess,
    handleMutationUpdatesApplied: highlightRecentlyAppliedCells,
    handleRowDeleteSuccess,
    closeRowEditor,
  }
}
