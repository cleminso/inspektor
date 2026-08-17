/**
 * Orchestrates the table query, selection, detail panes, row mutations, and draft transitions.
 *
 * URL search state owns query scope and row-editor identity. Local React state owns cell, column,
 * and checkbox selection. The table mutation provider owns edit drafts. This hook connects those
 * systems without duplicating parsing, dirty comparison, or Jazz mutation rules.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  DataGridCellTarget,
  DataGridFocusRequest,
  DataGridTable,
} from '@inspector/ds'
import type { CellSelectionState } from '@tanstack/react-table'
import type { ColumnDescriptor, DynamicTableRow } from 'jazz-tools'

import {
  useInspectorSessionState,
  useRuntimeClient,
  useRuntimeSchema,
} from '@app/providers/inspectorProvider'
import { useColumnVisibility } from '@tables/grid/useColumnVisibility'
import type { RowSelectionRequest } from '@tables/grid/buildColumns'
import {
  moveColumnInOrder,
  useColumnOrder,
  type ColumnMoveDirection,
} from '@tables/grid/useColumnOrder'
import { useTableGrid } from '@tables/grid/useTableGrid'
import { useTableRows } from '@tables/query/useTableRows'
import { useTableRowById } from '@tables/query/useTableRowById'
import { focusRowEditorField } from '@tables/rowEditor/fieldFocus'
import { useTableMutations } from '@tables/rowEditor/mutation/useTableMutation'
import { useTableExplorerSearchParams } from '@tables/routing/useTableSearchParams'
import { getTableColumns } from '@tables/schema/tableSchema'
import type { TableFilterClause } from '@tables/filters/tableFilters'
import type { TableMutationExecutor } from '@tables/mutationLedger/applyLedger'
import type { TableColumnMeta, TablePageSize, TableRowId } from '@tables/tableTypes'
import { getNearestSelectedRowId } from '@tables/grid/rowSelectionFocus'
import {
  getInlineFieldRoute,
  resolveSpreadsheetCompletionTarget,
  type SpreadsheetCompletionDirection,
} from '@tables/grid/inlineEditing'

interface UseTableViewStateOptions {
  disabledRowIds?: ReadonlySet<TableRowId>
  onUndoRowDeletion?: (rowId: TableRowId) => void
  tableName: string
}

const emptyDisabledRowIds: ReadonlySet<TableRowId> = new Set()

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

export type TableViewDetailPaneMode = 'closed' | 'insert' | 'rows'

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
  handleRowsStagedForDeletion: (rowIds: readonly TableRowId[]) => void
  handleRowEditorOpenChange: (open: boolean) => void
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
  rowEditor: TableViewRowEditorState
  rowValues: Record<string, unknown> | null
  selectedRowIds: readonly TableRowId[]
  schemaColumns: ColumnDescriptor[]
  setFilters: (filters: TableFilterClause[]) => Promise<void>
  setPage: (page: number) => void
  setPageSize: (pageSize: TablePageSize) => void
  table: DataGridTable<DynamicTableRow>
  tableColumns: TableColumnMeta[]
  tableKey: string
}

/**
 * Creates the empty source shape used to initialize an insert form.
 *
 * `undefined` means no value was supplied. `createInsertRowDraft` then decides from each descriptor
 * whether that field starts omitted, NULL, or as an empty required value.
 */
export function createInsertRowValues(schemaColumns: ColumnDescriptor[]): Record<string, unknown> {
  return Object.fromEntries(schemaColumns.map((column) => [column.name, undefined]))
}

/**
 * Builds the state and actions consumed by `TableView` for one runtime-selected Jazz table.
 *
 * Row target changes only change the visible projection. Provider-owned pending changes remain in
 * the mounted table state until Apply or Discard resolves them.
 */
export function useTableViewState({
  disabledRowIds = emptyDisabledRowIds,
  onUndoRowDeletion,
  tableName,
}: UseTableViewStateOptions): UseTableViewStateResult {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspectorSessionState()
  const client = useRuntimeClient()
  const wasmSchema = useRuntimeSchema()
  const searchState = useTableExplorerSearchParams()
  const query = useTableRows({ client, currentSchemaHash, tableName, wasmSchema })
  const schemaColumns = useMemo(
    () => getTableColumns(wasmSchema, tableName),
    [tableName, wasmSchema],
  )
  const editorMode = searchState.editorMode ?? 'closed'
  const activeRowId = searchState.editorMode === 'edit' ? searchState.rowId : null
  const [cellSelection, setCellSelection] = useState<CellSelectionState>([])
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [activeFieldEditorTarget, setActiveFieldEditorTarget] =
    useState<DataGridCellTarget | null>(null)
  const [cellFocusRequest, setCellFocusRequest] = useState<DataGridFocusRequest | null>(null)
  const [selectedRowIds, setSelectedRowIds] = useState<TableRowId[]>(() =>
    activeRowId === null ? [] : [activeRowId],
  )
  const mutations = useTableMutations({ client, tableName, wasmSchema })
  const tableKey = `${currentConnectionId ?? 'unknown'}:${currentBranch ?? 'unknown'}:${currentSchemaHash ?? 'unknown'}:${tableName}`
  const columnIds = useMemo(() => query.columns.map((column) => column.id), [query.columns])
  const visibility = useColumnVisibility({
    tableKey,
    columnIds,
  })
  const order = useColumnOrder({
    tableKey,
    columnIds,
  })

  const detailPaneMode: TableViewDetailPaneMode = editorMode === 'edit' ? 'rows' : editorMode
  // Filters, sorting, connection, branch, schema, and table define one selection scope.
  const selectionScopeKey = useMemo(
    () =>
      JSON.stringify({
        filters: searchState.filters,
        page: searchState.page,
        pageSize: searchState.pageSize,
        sortColumn: searchState.sortColumn,
        sortDirection: searchState.sortDirection,
        tableKey,
      }),
    [
      searchState.filters,
      searchState.page,
      searchState.pageSize,
      searchState.sortColumn,
      searchState.sortDirection,
      tableKey,
    ],
  )
  const selectionScopeKeyRef = useRef(selectionScopeKey)
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

  // Keep the edited row available when filtering or pagination removes it from the visible query.
  const activeRow = useTableRowById({ rowId: activeRowId, tableName })

  /**
   * Applies checkbox selection and chooses the one row whose draft is shown in the pane.
   *
   * Replacing insert mode or active row A with row B is guarded. Checking or unchecking other rows
   * while row A remains active does not disturb A's draft and therefore runs immediately.
   */
  const openRows = (nextSelectedRowIds: TableRowId[], nextActiveRowId: TableRowId | null) => {
    const requestedActiveRowId =
      nextActiveRowId !== null && nextSelectedRowIds.includes(nextActiveRowId) === true
        ? nextActiveRowId
        : nextSelectedRowIds[0]
    const transition = () => {
      const availableRowIds = nextSelectedRowIds
      const resolvedActiveRowId =
        requestedActiveRowId !== undefined && availableRowIds.includes(requestedActiveRowId)
          ? requestedActiveRowId
          : availableRowIds[0]
      setSelectedRowIds(availableRowIds)
      setActiveColumnId(null)
      setActiveFieldEditorTarget(null)

      if (availableRowIds.length === 0) {
        void searchState.setRowEditor(null, null)
        return
      }
      if (resolvedActiveRowId !== undefined) {
        void searchState.setRowEditor('edit', resolvedActiveRowId)
      }
    }
    transition()
  }

  const handleSelectedRowIdsChange = (
    nextSelectedRowIds: TableRowId[],
    request: RowSelectionRequest | null,
  ) => {
    if (request !== null) {
      const nextActiveRowId =
        request.checked === true
          ? request.rowId
          : activeRowId !== null &&
              activeRowId !== request.rowId &&
              nextSelectedRowIds.includes(activeRowId) === true
            ? activeRowId
            : getNearestSelectedRowId(validRowIds, nextSelectedRowIds, request.rowId)

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

  const resetSelection = useCallback(() => {
    setSelectedRowIds([])
    setCellSelection([])
    setActiveColumnId(null)
    setActiveFieldEditorTarget(null)
  }, [])

  useEffect(() => {
    if (selectionScopeKeyRef.current === selectionScopeKey) {
      return
    }

    // URL-driven scope changes invalidate row and cell positions from the preceding query.
    selectionScopeKeyRef.current = selectionScopeKey
    resetSelection()
  }, [resetSelection, selectionScopeKey])

  const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
    selectionScopeKeyRef.current = JSON.stringify({
      filters: searchState.filters,
      page: 1,
      pageSize: searchState.pageSize,
      sortColumn: columnId,
      sortDirection: direction,
      tableKey,
    })
    resetSelection()
    void searchState.setSorting(columnId, direction)
  }

  const setPage = (page: number) => {
    resetSelection()
    void query.setPage(page)
  }

  const setPageSize = (pageSize: TablePageSize) => {
    resetSelection()
    void query.setPageSize(pageSize)
  }

  const handleColumnVisibilityChange = (nextVisibility: Record<string, boolean>) => {
    visibility.setColumnVisibility(nextVisibility)
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
  const setColumnOrder = order.setColumnOrder
  const columnVisibilityRef = useRef(visibility.columnVisibility)
  columnVisibilityRef.current = visibility.columnVisibility
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
    columnOrder: order.columnOrder,
    disabledRowIds,
    rows: query.rows,
    columns: query.columns,
    sortColumn: searchState.sortColumn,
    sortDirection: searchState.sortDirection,
    selectedRowIds: visibleSelectedRowIds,
    columnVisibility: visibility.columnVisibility,
    onSortChange: handleSortChange,
    onUndoRowDeletion,
    onSelectedRowIdsChange: handleSelectedRowIdsChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onCellSelectionChange: setCellSelection,
    onColumnMenuOpen: handleColumnActivate,
    onColumnMove: handleColumnMove,
    onColumnOrderChange: setColumnOrder,
  })
  const activePageRowIndex =
    activeRowId === null ? -1 : query.rows.findIndex((row) => String(row.id) === activeRowId)
  const activePageRowNumber = activePageRowIndex < 0 ? null : activePageRowIndex + 1
  const selectedColumnId = cellSelection.at(-1)?.focusColumnId ?? null
  const activeColumnNumber =
    selectedColumnId === null
      ? 0
      : order.columnOrder
          .filter((columnId) => visibility.columnVisibility[columnId] !== false)
          .indexOf(selectedColumnId) + 1
  const selectedRow = useMemo(() => {
    const visibleSelectedRow = query.rows.find((row) => String(row.id) === activeRowId) ?? null
    if (visibleSelectedRow !== null) {
      return visibleSelectedRow
    }

    // The dedicated row query is the fallback, not a second source for visible rows.
    return activeRow
  }, [activeRow, activeRowId, query.rows])
  const rowValues = useMemo(() => {
    if (searchState.editorMode === 'insert') {
      return createInsertRowValues(schemaColumns)
    }

    return selectedRow
  }, [schemaColumns, searchState.editorMode, selectedRow])

  /** Closes presentation state without applying the stronger explicit-Cancel selection behavior. */
  const closeDetailPane = () => {
    void searchState.setRowEditor(null, null)
  }

  const handleEscape = () => {
    if (activeFieldEditorTarget !== null) {
      setActiveFieldEditorTarget(null)
      setCellFocusRequest((current) => ({
        requestId: (typeof current?.requestId === 'number' ? current.requestId : 0) + 1,
        target: activeFieldEditorTarget,
      }))
      return
    }
    if (detailPaneMode !== 'closed') {
      if (activeRowId !== null) {
        setSelectedRowIds((currentRowIds) =>
          currentRowIds.filter((rowId) => rowId !== activeRowId),
        )
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
    await mutations.insertRow(values)
    if (options.keepOpen === true) {
      return
    }
    query.resetPage()
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

  const requestCellFocus = (target: DataGridCellTarget) => {
    setCellFocusRequest((current) => ({
      requestId: (typeof current?.requestId === 'number' ? current.requestId : 0) + 1,
      target,
    }))
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
    detailPaneMode,
    error: query.error,
    table,
    loadedRowCount: query.loadedRowCount,
    mutationExecutor: mutations,
    page: query.page,
    pageSize: query.pageSize,
    hasNextPage: query.hasNextPage,
    hasPreviousPage: query.hasPreviousPage,
    hasCellSelection: cellSelection.length > 0,
    isInitialLoading: query.isInitialLoading,
    isRefreshing: query.isRefreshing,
    setPage,
    setPageSize,
    filters: searchState.filters,
    setFilters: async (filters) => {
      selectionScopeKeyRef.current = JSON.stringify({
        filters,
        page: 1,
        pageSize: searchState.pageSize,
        sortColumn: searchState.sortColumn,
        sortDirection: searchState.sortDirection,
        tableKey,
      })
      resetSelection()
      void searchState.setFilters(filters)
    },
    schemaColumns,
    tableColumns: query.columns,
    tableKey,
    rowValues,
    selectedRowIds,
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
      if (
        detailPaneMode !== 'closed'
      ) {
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
    handleRowsStagedForDeletion,
    handleRowEditorOpenChange: (open) => {
      if (open === false) {
        closeDetailPane()
      }
    },
    handleRowEditorCancel,
  }
}
