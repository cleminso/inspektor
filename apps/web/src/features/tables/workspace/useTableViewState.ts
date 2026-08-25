/**
 * Orchestrates the table query, selection, detail panes, row mutations, and draft transitions.
 *
 * URL search state owns query scope and row-editor identity. Local React state owns cell, column,
 * and checkbox selection. The table mutation provider owns edit drafts. This hook connects those
 * systems without duplicating parsing, dirty comparison, or Jazz mutation rules.
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

import type { DataGridCellTarget, DataGridFocusRequest, DataGridTable } from '@inspector/ds'
import type { CellSelectionState } from '@tanstack/react-table'
import type { ColumnDescriptor, DynamicTableRow } from 'jazz-tools'

import {
  useInspectorSessionState,
  useRuntimeClient,
  useRuntimeSchema,
} from '@app/providers/inspectorProvider'
import { moveColumnInOrder, type ColumnMoveDirection } from '@tables/grid/useColumnOrder'
import { useTablePreferences } from '@tables/grid/useTablePreferences'
import { useTableGrid } from '@tables/grid/useTableGrid'
import { useTableRows } from '@tables/query/useTableRows'
import { useTableRowById } from '@tables/query/useTableRowById'
import { focusRowEditorField } from '@tables/rowEditor/fieldFocus'
import { useTableMutations } from '@tables/rowEditor/mutation/useTableMutation'
import { useTableExplorerSearchParams } from '@tables/routing/useTableSearchParams'
import { getTableColumns } from '@tables/schema/tableSchema'
import type { TableFilterClause } from '@tables/filters/tableFilters'
import type { TableMutationExecutor } from '@tables/mutationLedger/applyLedger'
import { resolveTableSortColumn } from '@tables/query/tableRowsQuery'
import { createTableScope, createTableWorkspaceScope } from '@tables/workspace/scope'
import type {
  TableFieldsByRowId,
  TableColumnMeta,
  TablePageSize,
  TableRowId,
  TableValuesByRowId,
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
  stagedValuesByRowId?: TableValuesByRowId
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

interface TableViewRowEditorState {
  activeColumnNumber: number
  activePageRowNumber: number | null
  activeRowId: TableRowId | null
  activeRowIndex: number
  editedRowIds: TableRowId[]
  goToNextRow: () => void
  goToPreviousRow: () => void
  openInsert: () => void
}

type TableViewDetailPaneMode = 'closed' | 'insert' | 'rows'

interface UseTableViewStateResult {
  activeColumnId: string | null
  activeFieldEditorTarget: DataGridCellTarget | null
  canInspectSchema: boolean
  canMutateRows: boolean
  canOpenRowEditor: boolean
  cellFocusRequest: DataGridFocusRequest | null
  reorderableColumnIds: readonly string[]
  detailPaneMode: TableViewDetailPaneMode
  error: string | null
  filters: TableFilterClause[]
  handleEscape: () => void
  handleCellActivate: (target: DataGridCellTarget) => void
  handleCellEditRequest: (target: DataGridCellTarget) => void
  handleColumnActivate: (columnId: string | null) => void
  handleFieldEditorCancel: () => void
  handleFieldEditorComplete: (direction: SpreadsheetCompletionDirection) => void
  handleInsertSave: (
    values: Record<string, unknown>,
    options: InsertRowSaveOptions,
  ) => Promise<void>
  handleMutationApplySuccess: () => void
  handleMutationUpdatesApplied: (appliedUpdateFields: TableFieldsByRowId) => void
  handleRowsStagedForDeletion: (rowIds: readonly TableRowId[]) => void
  closeRowEditor: () => void
  handleRowEditorCancel: () => void
  hasNextPage: boolean
  hasPreviousPage: boolean
  hasCellSelection: boolean
  isInitialLoading: boolean
  isRefreshing: boolean
  loadedRowCount: number
  mutationExecutor: TableMutationExecutor
  page: number
  pageSize: TablePageSize
  recentlyAppliedCells: TableFieldsByRowId
  recentlyInsertedRowIds: ReadonlySet<TableRowId>
  rowEditor: TableViewRowEditorState
  rows: DynamicTableRow[]
  rowValues: Record<string, unknown> | null
  schemaColumns: ColumnDescriptor[]
  setFilters: (filters: TableFilterClause[]) => Promise<void>
  setPage: (page: number) => void
  setPageSize: (pageSize: TablePageSize) => void
  table: DataGridTable<DynamicTableRow>
  tableColumns: TableColumnMeta[]
  tableKey: string
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
  stagedValuesByRowId = emptyStagedValuesByRowId,
  tableName,
}: UseTableViewStateOptions): UseTableViewStateResult {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspectorSessionState()
  const client = useRuntimeClient()
  const wasmSchema = useRuntimeSchema()
  const searchState = useTableExplorerSearchParams()
  const tableKey = createTableScope(
    createTableWorkspaceScope({
      branch: currentBranch,
      connectionId: currentConnectionId,
      schemaHash: currentSchemaHash,
    }),
    tableName,
  )
  const schemaColumns = useMemo(
    () => getTableColumns(wasmSchema, tableName),
    [tableName, wasmSchema],
  )
  const sortColumn =
    wasmSchema === null
      ? searchState.sortColumn
      : resolveTableSortColumn(schemaColumns, searchState.sortColumn)
  const sortDirection = sortColumn === searchState.sortColumn ? searchState.sortDirection : 'asc'
  // Sort values schedule canonicalization; router command identity is not part of that condition.
  const setCanonicalSorting = useEffectEvent(searchState.setSorting)
  const query = useTableRows({
    client,
    onPageOutOfRange: () => searchState.setPage(1),
    search: {
      filters: searchState.filters,
      page: searchState.page,
      pageSize: searchState.pageSize,
      sortColumn,
      sortDirection,
    },
    scopeKey: tableKey,
    tableName,
    wasmSchema,
  })
  useEffect(() => {
    if (wasmSchema !== null && sortColumn !== searchState.sortColumn) {
      void setCanonicalSorting(sortColumn, sortDirection)
    }
  }, [searchState.sortColumn, sortColumn, sortDirection, wasmSchema])
  const editorMode = searchState.editorMode ?? 'closed'
  const activeRowId = searchState.editorMode === 'edit' ? searchState.rowId : null
  const [cellSelection, setCellSelection] = useState<CellSelectionState>([])
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [activeFieldEditorTarget, setActiveFieldEditorTarget] = useState<DataGridCellTarget | null>(
    null,
  )
  const [cellFocusRequest, setCellFocusRequest] = useState<DataGridFocusRequest | null>(null)
  const [selectedRowIds, setSelectedRowIds] = useState<TableRowId[]>(() =>
    activeRowId === null ? [] : [activeRowId],
  )
  const [recentlyInsertedRowIds, setRecentlyInsertedRowIds] = useState<ReadonlySet<TableRowId>>(
    emptyRecentlyInsertedRowIds,
  )
  const [recentlyAppliedCells, setRecentlyAppliedCells] =
    useState<TableFieldsByRowId>(emptyRecentlyAppliedCells)
  const recentChangeTimersRef = useRef(
    new Map<TableRowId | typeof recentlyAppliedTimerKey, ReturnType<typeof setTimeout>>(),
  )

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
    setRecentlyInsertedRowIds((currentRowIds) => {
      if (currentRowIds.has(rowId) === true) {
        return currentRowIds
      }

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

  const highlightRecentlyAppliedCells = (appliedUpdateFields: TableFieldsByRowId) => {
    if (Object.keys(appliedUpdateFields).length === 0) {
      return
    }

    setRecentlyAppliedCells(appliedUpdateFields)
    scheduleRecentChangeExpiry(recentlyAppliedTimerKey, () => {
      setRecentlyAppliedCells(emptyRecentlyAppliedCells)
    })
  }
  const mutations = useTableMutations({ client, tableName, wasmSchema })
  const columnIds = useMemo(() => query.columns.map((column) => column.id), [query.columns])
  const tablePreferences = useTablePreferences({
    tableKey,
    columnIds,
  })

  const detailPaneMode: TableViewDetailPaneMode = editorMode === 'edit' ? 'rows' : editorMode
  // Filters, sorting, connection, branch, schema, and table define one selection scope.
  const selectionScopeKey = JSON.stringify({
    filters: searchState.filters,
    page: searchState.page,
    pageSize: searchState.pageSize,
    sortColumn,
    sortDirection,
    tableKey,
  })
  const selectionRouteRef = useRef({ activeRowId, selectionScopeKey })
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
  const activeRowIndex = activeRowId === null ? 0 : Math.max(editedRowIds.indexOf(activeRowId), 0)
  const validRowIds = useMemo(() => query.rows.map((row) => String(row.id)), [query.rows])
  const visibleSelectedRowIds = useMemo(() => {
    const validRowIdSet = new Set(validRowIds)
    return effectiveSelectedRowIds.filter((rowId) => validRowIdSet.has(rowId) === true)
  }, [effectiveSelectedRowIds, validRowIds])

  const activePageRowIndex =
    activeRowId === null ? -1 : query.rows.findIndex((row) => String(row.id) === activeRowId)
  const visibleActiveRow = activePageRowIndex < 0 ? null : (query.rows[activePageRowIndex] ?? null)
  // Keep the edited row available when filtering or pagination removes it from the visible query.
  const activeRow = useTableRowById({
    client,
    rowId: visibleActiveRow === null ? activeRowId : null,
    tableName,
    wasmSchema,
  })

  /** Keeps the active draft while selected; otherwise routes to the requested or first selected row. */
  const openRows = (nextSelectedRowIds: TableRowId[], nextActiveRowId: TableRowId | null) => {
    const resolvedActiveRowId =
      nextActiveRowId !== null && nextSelectedRowIds.includes(nextActiveRowId) === true
        ? nextActiveRowId
        : nextSelectedRowIds[0]
    setSelectedRowIds(nextSelectedRowIds)
    setActiveColumnId(null)
    setActiveFieldEditorTarget(null)

    if (resolvedActiveRowId === undefined) {
      void searchState.setRowEditor(null, null)
      return
    }
    void searchState.setRowEditor('edit', resolvedActiveRowId)
  }

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
    setActiveFieldEditorTarget(null)
  }, [])

  useLayoutEffect(() => {
    const previousRoute = selectionRouteRef.current
    selectionRouteRef.current = { activeRowId, selectionScopeKey }
    if (previousRoute.selectionScopeKey !== selectionScopeKey) {
      resetSelection(activeRowId === null ? [] : [activeRowId])
      return
    }
    if (activeRowId !== null && previousRoute.activeRowId !== activeRowId) {
      setSelectedRowIds((currentRowIds) =>
        currentRowIds.includes(activeRowId) === true ? currentRowIds : [activeRowId],
      )
    }
  }, [activeRowId, resetSelection, selectionScopeKey])

  const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
    void searchState.setSorting(columnId, direction)
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
  const columnVisibilityRef = useRef(tablePreferences.columnVisibility)
  columnVisibilityRef.current = tablePreferences.columnVisibility
  const handleColumnMove = useCallback(
    (columnId: string, direction: ColumnMoveDirection) => {
      setColumnOrder((currentColumnOrder) => {
        const visibleColumnOrder = currentColumnOrder.filter(
          (candidateId) => columnVisibilityRef.current[candidateId] !== false,
        )
        return moveColumnInOrder(currentColumnOrder, columnId, direction, visibleColumnOrder)
      })
    },
    [setColumnOrder],
  )

  const table = useTableGrid({
    cellSelection,
    columnOrder: tablePreferences.columnOrder,
    disabledRowIds,
    rows: query.rows,
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
  })
  const activePageRowNumber = activePageRowIndex < 0 ? null : activePageRowIndex + 1
  const selectedColumnId = cellSelection.at(-1)?.anchorColumnId ?? null
  const activeColumnNumber =
    selectedColumnId === null
      ? 0
      : tablePreferences.columnOrder
          .filter((columnId) => tablePreferences.columnVisibility[columnId] !== false)
          .indexOf(selectedColumnId) + 1
  const selectedRow = visibleActiveRow ?? activeRow
  const rowValues = useMemo(() => {
    if (searchState.editorMode === 'insert') {
      return {}
    }

    return selectedRow
  }, [searchState.editorMode, selectedRow])

  /** Closes presentation state without applying the stronger explicit-Cancel selection behavior. */
  const closeDetailPane = () => {
    void searchState.setRowEditor(null, null)
  }

  const requestCellFocus = (target: DataGridCellTarget) => {
    setCellFocusRequest((current) => ({
      requestId: (typeof current?.requestId === 'number' ? current.requestId : 0) + 1,
      target,
    }))
  }

  const handleEscape = () => {
    if (activeFieldEditorTarget !== null) {
      setActiveFieldEditorTarget(null)
      requestCellFocus(activeFieldEditorTarget)
      return
    }
    if (detailPaneMode !== 'closed') {
      if (activeRowId !== null) {
        setSelectedRowIds((currentRowIds) => currentRowIds.filter((rowId) => rowId !== activeRowId))
      }
      closeDetailPane()
      return
    }

    const activeElement = document.activeElement
    if (
      activeElement instanceof HTMLElement &&
      activeElement.closest('[data-slot="data-grid-cell"]') !== null
    ) {
      activeElement.blur()
    }
    setCellSelection([])
    setActiveColumnId(null)
  }

  const openInsert = () => {
    resetSelection()
    void searchState.setRowEditor('insert', null)
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
    void searchState.setPage(1)
    closeDetailPane()
  }

  const handleMutationApplySuccess = () => {
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
    setActiveFieldEditorTarget(null)
    closeDetailPane()
  }

  const goToRowIndex = (nextActiveRowIndex: number) => {
    const nextActiveRowId = editedRowIds[nextActiveRowIndex] ?? null
    if (nextActiveRowId === null) {
      return
    }

    void searchState.setRowEditor('edit', nextActiveRowId)
  }

  const goToPreviousRow = () => {
    goToRowIndex(Math.max(activeRowIndex - 1, 0))
  }

  const goToNextRow = () => {
    goToRowIndex(Math.min(activeRowIndex + 1, editedRowIds.length - 1))
  }

  /**
   * Performs explicit form Cancel rather than guarded pane dismissal.
   *
   * Insert Cancel closes the pane. Edit Cancel discards the draft, unchecks the active row, and
   * focuses the nearest remaining checked row or closes the pane when none remain.
   */
  const handleRowEditorCancel = () => {
    if (activeRowId === null) {
      closeDetailPane()
      return
    }

    const nextSelectedRowIds = effectiveSelectedRowIds.filter((rowId) => rowId !== activeRowId)
    setSelectedRowIds(nextSelectedRowIds)
    const nextActiveRowId = getNearestSelectedRowId(validRowIds, nextSelectedRowIds, activeRowId)
    if (nextActiveRowId === null) {
      void searchState.setRowEditor(null, null)
      return
    }
    void searchState.setRowEditor('edit', nextActiveRowId)
  }

  const handleFieldEditorCancel = () => {
    if (activeFieldEditorTarget === null) {
      return
    }
    setActiveFieldEditorTarget(null)
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
    setActiveFieldEditorTarget(null)
    requestCellFocus(target)
  }

  return {
    activeColumnId,
    activeFieldEditorTarget,
    canInspectSchema: wasmSchema !== null,
    canMutateRows: client !== null && wasmSchema !== null,
    canOpenRowEditor: wasmSchema !== null,
    cellFocusRequest,
    reorderableColumnIds: columnIds,
    recentlyAppliedCells,
    recentlyInsertedRowIds,
    detailPaneMode,
    error: query.error,
    table,
    loadedRowCount: query.rows.length,
    rows: query.rows,
    mutationExecutor: mutations,
    page: searchState.page,
    pageSize: searchState.pageSize,
    hasNextPage: query.hasNextPage,
    hasPreviousPage: searchState.page > 1,
    hasCellSelection: cellSelection.length > 0,
    isInitialLoading: query.isInitialLoading,
    isRefreshing: query.isRefreshing,
    setPage: searchState.setPage,
    setPageSize: searchState.setPageSize,
    filters: searchState.filters,
    setFilters: searchState.setFilters,
    schemaColumns,
    tableColumns: query.columns,
    tableKey,
    rowValues,
    rowEditor: {
      activeColumnNumber,
      activePageRowNumber,
      activeRowId: detailPaneMode === 'rows' ? activeRowId : null,
      activeRowIndex,
      editedRowIds,
      goToNextRow,
      goToPreviousRow,
      openInsert,
    },
    handleCellActivate: (target) => {
      setActiveColumnId(null)
      if (detailPaneMode === 'rows' && target.rowId === activeRowId) {
        requestAnimationFrame(() => {
          focusRowEditorField(target.columnId)
        })
      }
    },
    handleCellEditRequest: (target) => {
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
      if (route === 'readOnly') {
        return
      }
      setActiveColumnId(null)
      setActiveFieldEditorTarget(target)
    },
    handleEscape,
    handleColumnActivate,
    handleFieldEditorCancel,
    handleFieldEditorComplete,
    handleInsertSave,
    handleMutationApplySuccess,
    handleMutationUpdatesApplied: highlightRecentlyAppliedCells,
    handleRowsStagedForDeletion,
    closeRowEditor: closeDetailPane,
    handleRowEditorCancel,
  }
}
