/**
 * Orchestrates the table query, selection, detail panes, row mutations, and draft transitions.
 *
 * URL search state owns query scope and row-editor identity. Local React state owns cell, column,
 * and checkbox selection. Row forms own field drafts. This hook connects those systems without
 * duplicating parsing, dirty comparison, or Jazz mutation rules.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { DataGridCellTarget, DataGridTable } from '@inspector/ds'
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
import { prefetchEditRowForm } from '@tables/rowEditor/rowEditorModules'
import { useTableRows } from '@tables/query/useTableRows'
import { useTableRowById } from '@tables/query/useTableRowById'
import { focusRowEditorField } from '@tables/rowEditor/fieldFocus'
import { useDraftTransitionGuard } from '@tables/rowEditor/mutation/useDraftTransitionGuard'
import { useTableMutations } from '@tables/rowEditor/mutation/useTableMutation'
import { useTableExplorerSearchParams } from '@tables/routing/useTableSearchParams'
import { getTableColumns } from '@tables/schema/tableSchema'
import type { TableFilterClause } from '@tables/filters/tableFilters'
import type { TableColumnMeta, TablePageSize, TableRowId } from '@tables/tableTypes'
import { getNearestSelectedRowId } from '@tables/grid/rowSelectionFocus'

interface UseTableViewStateOptions {
  tableName: string
}

interface TableViewRowEditorState {
  activeRowId: TableRowId | null
  activeRowIndex: number
  editedRowIds: TableRowId[]
  goToNextRow: () => void
  goToPreviousRow: () => void
  openInsert: () => void
}

export type TableViewDetailPaneMode = 'closed' | 'insert' | 'rows'

interface InsertRowSaveOptions {
  keepOpen: boolean
}

interface TableViewDraftTransitionState {
  discardAndContinue: () => void
  isPending: boolean
  isSaving: boolean
  keepEditing: () => void
}

interface UseTableViewStateResult {
  activeColumnId: string | null
  canEditRows: boolean
  reorderableColumnIds: readonly string[]
  detailPaneMode: TableViewDetailPaneMode
  draftTransition: TableViewDraftTransitionState
  error: string | null
  filters: TableFilterClause[]
  handleDelete: (() => Promise<void>) | undefined
  handleEditSave: (values: Record<string, unknown>) => Promise<void>
  handleEscape: () => void
  handleInsertSave: (
    values: Record<string, unknown>,
    options?: InsertRowSaveOptions,
  ) => Promise<void>
  handleCellActivate: (target: DataGridCellTarget) => void
  handleColumnActivate: (columnId: string | null) => void
  handleRowEditorOpenChange: (open: boolean) => void
  handleRowEditorCancel: () => void
  handleRowDraftDirtyChange: (isDirty: boolean) => void
  hasNextPage: boolean
  hasPreviousPage: boolean
  hasCellSelection: boolean
  isInitialLoading: boolean
  isRefreshing: boolean
  loadedRowCount: number
  page: number
  pageSize: TablePageSize
  rowEditor: TableViewRowEditorState
  rowValues: Record<string, unknown> | null
  schemaColumns: ColumnDescriptor[]
  setFilters: (filters: TableFilterClause[]) => Promise<void>
  setPage: (page: number) => void
  setPageSize: (pageSize: TablePageSize) => void
  table: DataGridTable<DynamicTableRow>
  tableColumns: TableColumnMeta[]
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
 * Target-changing actions are closures passed to `useDraftTransitionGuard`. For example, selecting
 * row B while row A is dirty does not update selection or URL state immediately. The closure runs
 * only after Save and continue or Discard and continue. Selection changes around row A can proceed
 * because they do not replace the active draft target.
 */
export function useTableViewState({
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
  const [selectedRowIds, setSelectedRowIds] = useState<TableRowId[]>(() =>
    activeRowId === null ? [] : [activeRowId],
  )
  const deletedRowIdsRef = useRef<Set<TableRowId>>(new Set())
  const mutations = useTableMutations({ client, tableName, wasmSchema })
  const draftTransition = useDraftTransitionGuard()
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
  useEffect(() => {
    const validRowIdSet = new Set(validRowIds)
    for (const deletedRowId of deletedRowIdsRef.current) {
      if (validRowIdSet.has(deletedRowId) === false) {
        deletedRowIdsRef.current.delete(deletedRowId)
      }
    }
  }, [validRowIds])
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
      const availableRowIds = nextSelectedRowIds.filter(
        (rowId) => deletedRowIdsRef.current.has(rowId) === false,
      )
      const resolvedActiveRowId =
        requestedActiveRowId !== undefined && availableRowIds.includes(requestedActiveRowId)
          ? requestedActiveRowId
          : availableRowIds[0]
      setSelectedRowIds(availableRowIds)
      setActiveColumnId(null)

      if (availableRowIds.length === 0) {
        void searchState.setRowEditor(null, null, { replace: false })
        return
      }
      if (resolvedActiveRowId !== undefined) {
        void searchState.setRowEditor('edit', resolvedActiveRowId, { replace: false })
      }
    }
    const changesDraftTarget =
      searchState.editorMode === 'insert' ||
      (searchState.editorMode === 'edit' && requestedActiveRowId !== activeRowId)

    if (changesDraftTarget === true) {
      draftTransition.request(transition)
    } else {
      transition()
    }
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
    draftTransition.request(() => {
      // Set the ref inside the guarded closure so Keep editing leaves selection and scope untouched.
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
    })
  }

  const setPage = (page: number) => {
    draftTransition.request(() => {
      resetSelection()
      void query.setPage(page)
    })
  }

  const setPageSize = (pageSize: TablePageSize) => {
    draftTransition.request(() => {
      resetSelection()
      void query.setPageSize(pageSize)
    })
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
    rows: query.rows,
    columns: query.columns,
    sortColumn: searchState.sortColumn,
    sortDirection: searchState.sortDirection,
    selectedRowIds: visibleSelectedRowIds,
    columnVisibility: visibility.columnVisibility,
    onSortChange: handleSortChange,
    onSelectedRowIdsChange: handleSelectedRowIdsChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onCellSelectionChange: setCellSelection,
    onColumnMenuOpen: handleColumnActivate,
    onColumnMove: handleColumnMove,
    onEditIntent: prefetchEditRowForm,
    onColumnOrderChange: setColumnOrder,
  })
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
    void searchState.setRowEditor(null, null, { replace: false })
  }

  const handleEscape = () => {
    if (detailPaneMode !== 'closed') {
      draftTransition.request(closeDetailPane)
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
    draftTransition.request(() => {
      void searchState.setRowEditor('insert', null, { replace: false })
    })
  }

  const goToRowIndex = (nextActiveRowIndex: number) => {
    const nextActiveRowId = editedRowIds[nextActiveRowIndex] ?? null
    if (nextActiveRowId === null) {
      return
    }

    draftTransition.request(() => {
      void searchState.setRowEditor('edit', nextActiveRowId, { replace: false })
    })
  }

  const goToPreviousRow = () => {
    goToRowIndex(Math.max(activeRowIndex - 1, 0))
  }

  const goToNextRow = () => {
    goToRowIndex(Math.min(activeRowIndex + 1, editedRowIds.length - 1))
  }

  const handleDelete =
    searchState.editorMode === 'edit' && activeRowId !== null
      ? async () => {
          const rowIdToDelete = activeRowId

          if (rowIdToDelete === null) {
            return
          }

          const continued = await draftTransition.runMutation(() =>
            mutations.deleteRow(rowIdToDelete),
          )
          deletedRowIdsRef.current.add(rowIdToDelete)
          setSelectedRowIds((currentRowIds) =>
            currentRowIds.filter((rowId) => rowId !== rowIdToDelete),
          )
          if (continued === true) {
            // Save/Discard continuation owns the destination; do not also choose a neighboring row.
            return
          }
          const nextEditedRowIds = editedRowIds.filter((rowId) => rowId !== rowIdToDelete)

          if (nextEditedRowIds.length === 0) {
            closeDetailPane()
            return
          }

          const nextActiveRowIndex = Math.min(activeRowIndex, nextEditedRowIds.length - 1)
          const nextActiveRowId = nextEditedRowIds[nextActiveRowIndex] ?? null
          setSelectedRowIds(nextEditedRowIds)
          void searchState.setRowEditor('edit', nextActiveRowId, { replace: false })
        }
      : undefined

  /**
   * Performs explicit form Cancel rather than guarded pane dismissal.
   *
   * Insert Cancel closes the pane. Edit Cancel discards the draft, unchecks the active row, and
   * focuses the nearest remaining checked row or closes the pane when none remain.
   */
  const handleRowEditorCancel = () => {
    draftTransition.clear()
    if (activeRowId === null) {
      closeDetailPane()
      return
    }

    const nextSelectedRowIds = effectiveSelectedRowIds.filter((rowId) => rowId !== activeRowId)
    setSelectedRowIds(nextSelectedRowIds)
    const nextActiveRowId = getNearestSelectedRowId(validRowIds, nextSelectedRowIds, activeRowId)
    if (nextActiveRowId === null) {
      void searchState.setRowEditor(null, null, { replace: false })
      return
    }
    void searchState.setRowEditor('edit', nextActiveRowId, { replace: false })
  }

  return {
    activeColumnId,
    canEditRows: client !== null && wasmSchema !== null,
    reorderableColumnIds: columnIds,
    detailPaneMode,
    draftTransition,
    error: query.error,
    table,
    loadedRowCount: query.loadedRowCount,
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
      draftTransition.request(() => {
        // Keep the existing selection when the user rejects this guarded filter change.
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
      })
    },
    schemaColumns,
    tableColumns: query.columns,
    rowValues,
    rowEditor: {
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
    handleEscape,
    handleColumnActivate,
    handleRowEditorOpenChange: (open) => {
      if (open === false) {
        draftTransition.request(closeDetailPane)
      }
    },
    handleRowDraftDirtyChange: draftTransition.handleDirtyChange,
    handleRowEditorCancel,
    handleDelete,
    handleEditSave: async (values) => {
      if (activeRowId !== null) {
        // Ordinary edit saves keep the pane open; live row reconciliation clears saved overlays.
        await draftTransition.runMutation(() => mutations.updateRow(activeRowId, values))
      }
    },
    handleInsertSave: async (values, options) => {
      const continued = await draftTransition.runMutation(() => mutations.insertRow(values))

      if (continued === true) {
        // A pending destination replaces normal close or Insert more behavior.
        return
      }

      void query.resetPage()

      if (options?.keepOpen === true) {
        return
      }

      closeDetailPane()
    },
  }
}
