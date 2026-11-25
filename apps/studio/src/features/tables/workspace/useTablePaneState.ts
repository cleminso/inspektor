import { useCallback, useRef, useState } from 'react'
import type { DataGridCellTarget } from '@inspektor/ds'
import type { CellSelectionState } from '@tanstack/react-table'
import type { TableColumnMeta, TableRowId } from '@tables/tableTypes'

type DetailPaneState =
  | { mode: 'closed' }
  | { mode: 'insert'; values?: Record<string, unknown> }
  | { mode: 'rows'; activeRowId: TableRowId }

type PendingPageRowNavigation = {
  edge: 'first' | 'last'
  page: number
}

/** Owns guarded pane targets and local selection, not row drafts or query results. */
export function useTablePaneState(requestTransition: (action: () => void) => void) {
  const [detailPane, setDetailPane] = useState<DetailPaneState>({ mode: 'closed' })
  const [requestedField, setRequestedField] = useState<DataGridCellTarget | null>(null)
  const [insertRevision, setInsertRevision] = useState(0)
  const detailPaneMode = detailPane.mode
  const activeRowId = detailPane.mode === 'rows' ? detailPane.activeRowId : null
  const [cellSelection, setCellSelection] = useState<CellSelectionState>([])
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [selectedRowIds, setSelectedRowIds] = useState<TableRowId[]>([])
  const pendingPageRowNavigationRef = useRef<PendingPageRowNavigation | null>(null)

  /** Keeps the active draft while selected; otherwise opens the requested or first selected row. */
  const openRows = useCallback(
    (nextSelectedRowIds: TableRowId[], nextActiveRowId: TableRowId | null) => {
      pendingPageRowNavigationRef.current = null
      const resolvedActiveRowId =
        nextActiveRowId !== null && nextSelectedRowIds.includes(nextActiveRowId) === true
          ? nextActiveRowId
          : nextSelectedRowIds[0]
      const commit = () => {
        setRequestedField(null)
        setSelectedRowIds(resolvedActiveRowId === undefined ? [] : [resolvedActiveRowId])
        setActiveColumnId(null)
        if (resolvedActiveRowId === undefined) {
          setDetailPane({ mode: 'closed' })
          return
        }
        setDetailPane({ mode: 'rows', activeRowId: resolvedActiveRowId })
      }
      if (resolvedActiveRowId === activeRowId) commit()
      else requestTransition(commit)
    },
    [activeRowId, requestTransition],
  )
  const resetSelection = useCallback((nextSelectedRowIds: TableRowId[] = []) => {
    setRequestedField(null)
    setSelectedRowIds(nextSelectedRowIds)
    setCellSelection([])
    setActiveColumnId(null)
  }, [])
  const closeDetailPane = () => {
    setRequestedField(null)
    pendingPageRowNavigationRef.current = null
    setDetailPane({ mode: 'closed' })
  }
  const closeRowEditor = () => {
    requestTransition(() => {
      setSelectedRowIds([])
      closeDetailPane()
    })
  }
  const handleEscape = () => {
    if (detailPaneMode !== 'closed') {
      closeRowEditor()
      return
    }
    setCellSelection([])
    setActiveColumnId(null)
  }
  const openInsert = (values?: Record<string, unknown>) => {
    requestTransition(() => {
      pendingPageRowNavigationRef.current = null
      resetSelection()
      setInsertRevision((revision) => revision + 1)
      setDetailPane({ mode: 'insert', values })
    })
  }
  const handleRowDeleteSuccess = (rowId: TableRowId) => {
    setSelectedRowIds((currentRowIds) =>
      currentRowIds.filter((candidateId) => candidateId !== rowId),
    )
    setCellSelection([])
    setActiveColumnId(null)
    closeDetailPane()
  }
  const handleColumnActivate = useCallback((columnId: string | null) => {
    if (columnId !== null) {
      setCellSelection([])
    }
    setActiveColumnId(columnId)
  }, [])
  const handleCellActivate = (target: DataGridCellTarget) => {
    setActiveColumnId(null)
    if (detailPaneMode === 'rows' && target.rowId === activeRowId) {
      setRequestedField({ ...target })
    }
  }
  const handleCellEditRequest = (
    target: DataGridCellTarget,
    columns: readonly TableColumnMeta[],
  ) => {
    const columnMeta = columns.find((column) => column.id === target.columnId)
    if (columnMeta === undefined) {
      return
    }
    const open = () => {
      setSelectedRowIds([target.rowId])
      setActiveColumnId(null)
      setDetailPane({ mode: 'rows', activeRowId: target.rowId })
      setRequestedField({ ...target })
    }
    if (activeRowId === target.rowId) open()
    else requestTransition(open)
  }

  return {
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
    handleCellActivate,
    handleCellEditRequest,
  }
}
