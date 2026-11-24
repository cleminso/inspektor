import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  AlertDialog,
  Box,
  Button,
  DataGrid,
  KeyboardInput,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Text,
  Tooltip,
  toasts,
  type BinaryCopyFormat,
  type DataGridCellTarget,
} from '@inspektor/ds'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useBlocker } from '@tanstack/react-router'

import {
  appHotkeyOptions,
  runAppHotkey,
  useAppCommands,
  type AppCommand,
} from '@app/hotkeys/appHotkeys'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'
import { productGlyphs } from '@app/icons/productGlyphs'
import { useRuntimeSchema } from '@app/providers/inspectorProvider'
import { useConnectionContentReady } from '@app/runtime/connectionContentBoundary'
import { ColumnDragPreview } from '@tables/grid/buildColumns'
import { DataGridColumnVisibility } from '@tables/grid/columnVisibility'
import { TableGridContextMenu } from '@tables/grid/tableGridContextMenu'
import { DataGridFilterBuilder } from '@tables/filters/dataGridFilterBuilder'
import {
  canCreateTableFilterClauseFromValue,
  createTableFilterClauseFromValue,
  tableIdFilterColumn,
} from '@tables/filters/filterParsing'
import type { TableFilterValueMatch } from '@tables/filters/tableFilters'
import { serializeCellValueForClipboard } from '@tables/grid/cellActions'
import { resolveStagedFieldValue } from '@tables/grid/stagedFieldValue'
import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'
import { DataGridExport, TablePagination, Toolbar } from '@tables/grid/toolbar'
import { EditRowForm, type RowRepresentation } from '@tables/rowEditor/editForm'
import { InsertRowForm } from '@tables/rowEditor/insertForm'
import { RowEditorSidePanel } from '@tables/rowEditor/sidePane'
import { getTableColumns } from '@tables/schema/tableSchema'
import { useTableTabs } from '@tables/workspace/tabsProvider'
import { useTableViewState } from '@tables/workspace/useTableViewState'
import {
  TableMutationLedgerProvider,
  useTableMutationEditorController,
  useTableMutationLedger,
  useTableMutationWorkspace,
} from '@tables/mutationLedger/provider'
import type { ColumnDescriptor } from 'jazz-tools'
import type { DynamicTableRow, TableRowId } from '@tables/tableTypes'
import { appRoutes } from '@app/routing/appRoutes'
import { createTableScope } from '@tables/workspace/scope'

interface TableViewProps {
  tableName: string
}

type PaneFocusReturn = { kind: 'insert' } | { kind: 'row'; rowId: TableRowId }

function RowEditorStatus({ label }: { label: string }): React.ReactElement {
  return (
    <Box
      height="full"
      alignItems="center"
      justifyContent="center"
      role="status"
      aria-live="polite"
    >
      <Text color="muted">{label}</Text>
    </Box>
  )
}

function RowEditorError({ message }: { message: string }): React.ReactElement {
  return (
    <Box
      height="full"
      alignItems="center"
      justifyContent="center"
      role="alert"
    >
      <Text color="error">{message}</Text>
    </Box>
  )
}

interface EditRowPaneProps {
  requestedField: DataGridCellTarget | null
  disabled: boolean
  onSave: (values: Record<string, unknown>) => Promise<DynamicTableRow | null>
  onRepresentationChange: (representation: RowRepresentation) => void
  representation: RowRepresentation
  rowId: TableRowId
  rowValues: Record<string, unknown>
  schemaColumns: ColumnDescriptor[]
}

function EditRowPane({
  requestedField,
  disabled,
  onSave,
  onRepresentationChange,
  representation,
  rowId,
  rowValues,
  schemaColumns,
}: EditRowPaneProps): React.ReactElement {
  const [sourceValues, setSourceValues] = useState(rowValues)
  useEffect(() => {
    setSourceValues(rowValues)
  }, [rowValues])
  const draftController = useTableMutationEditorController({
    initialRowValues: sourceValues,
    rowId,
  })

  return (
    <EditRowForm
      key={rowId}
      draftController={draftController}
      requestedField={requestedField}
      disabled={disabled}
      onSave={async (values) => {
        const refreshedRow = await onSave(values)
        if (refreshedRow !== null) setSourceValues(refreshedRow)
      }}
      onRepresentationChange={onRepresentationChange}
      representation={representation}
      rowValues={sourceValues}
      schemaColumns={schemaColumns}
    />
  )
}

export function TableView({ tableName }: TableViewProps): React.ReactElement {
  const wasmSchema = useRuntimeSchema()
  const { scope } = useTableTabs()
  const schemaColumns = useMemo(
    () => getTableColumns(wasmSchema, tableName),
    [tableName, wasmSchema],
  )
  const mutationScopeKey = createTableScope(scope, tableName)

  return (
    <TableMutationLedgerProvider
      schemaColumns={schemaColumns}
      scopeKey={mutationScopeKey}
    >
      <TableViewContent
        schemaColumns={schemaColumns}
        tableKey={mutationScopeKey}
        tableName={tableName}
      />
    </TableMutationLedgerProvider>
  )
}

function TableViewContent({
  schemaColumns,
  tableKey,
  tableName,
}: TableViewProps & {
  schemaColumns: ColumnDescriptor[]
  tableKey: string
}): React.ReactElement {
  const mutations = useTableMutationLedger()
  const discardAll = mutations.discardAll
  const mutationWorkspace = useTableMutationWorkspace()
  const operationPendingRef = useRef(false)
  const transitionApprovedRef = useRef(false)
  const [editRevision, setEditRevision] = useState(0)
  const [deleteRequestedRowId, setDeleteRequestedRowId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pendingTransition, setPendingTransition] = useState<(() => void) | null>(null)
  const requestTransition = useCallback(
    (action: () => void) => {
      if (operationPendingRef.current === true || mutations.execution.status === 'applying') return
      if (mutations.stagedCount > 0 && transitionApprovedRef.current === false) {
        setPendingTransition(() => action)
        return
      }
      if (mutations.execution.status === 'failed' && mutations.stagedCount === 0) {
        discardAll()
      }
      action()
    },
    [discardAll, mutations.execution.status, mutations.stagedCount],
  )
  const routeBlocker = useBlocker({
    enableBeforeUnload: false,
    withResolver: true,
    shouldBlockFn: ({ current, next }) =>
      (mutationWorkspace.hasPendingChanges(tableKey) === true ||
        operationPendingRef.current === true) &&
      next.fullPath.startsWith(appRoutes.tables) === true &&
      'connectionId' in current.params &&
      'connectionId' in next.params &&
      current.params.connectionId === next.params.connectionId,
  })
  const [rowRepresentationState, setRowRepresentationState] = useState<{
    representation: RowRepresentation
    tableKey: string
  }>({ representation: 'details', tableKey })
  const rowRepresentation =
    rowRepresentationState.tableKey === tableKey ? rowRepresentationState.representation : 'details'
  const { rebaseRows } = mutations
  const state = useTableViewState({
    requestTransition,
    retainDisabledRows: mutations.execution.status !== 'idle',
    schemaColumns,
    stagedValuesByRowId: mutations.stagedValuesByRowId,
    tableKey,
    tableName,
  })
  useConnectionContentReady(state.isInitialLoading === false)
  useEffect(() => {
    setDeleteError(null)
  }, [state.rowEditor.activeRowId, tableKey])
  useEffect(() => {
    if (deleteRequestedRowId !== null && deleteRequestedRowId !== state.rowEditor.activeRowId) {
      setDeleteRequestedRowId(null)
    }
  }, [deleteRequestedRowId, state.rowEditor.activeRowId])
  const { openSchemaView } = useTableTabs()
  const gridHotkeyTargetRef = useRef<HTMLDivElement>(null)
  const insertRowButtonRef = useRef<HTMLButtonElement>(null)
  const paneFocusReturnRef = useRef<PaneFocusReturn | null>(null)
  const pendingPaletteFocusReturnRef = useRef<MutationObserver | null>(null)
  const previousDetailPaneModeRef = useRef(state.detailPaneMode)
  const gridHotkeyOptions = { ...appHotkeyOptions, target: gridHotkeyTargetRef }
  const mutationApplying = mutations.execution.status === 'applying'
  useEffect(() => {
    if (mutationApplying === true && routeBlocker.status === 'blocked') routeBlocker.reset()
  }, [mutationApplying, routeBlocker])
  const cancelRowChanges = () => {
    if (operationPendingRef.current === true) return
    mutations.discardAll()
    setEditRevision((revision) => revision + 1)
    setDeleteError(null)
    setDeleteRequestedRowId(null)
  }
  const saveRow = async (values: Record<string, unknown>): Promise<DynamicTableRow | null> => {
    const rowId = state.rowEditor.activeRowId
    if (rowId === null || operationPendingRef.current === true) return null
    operationPendingRef.current = true
    mutations.setExecution({ status: 'applying', error: null })
    try {
      try {
        await state.mutationExecutor.updateRow(rowId, values)
      } catch (error) {
        mutations.setExecution({ status: 'failed', error: String(error) })
        throw error
      }
      let refreshedRow: DynamicTableRow | null
      try {
        refreshedRow = await state.mutationExecutor.readRow(rowId)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(
          `Row saved, but refresh failed. Reload the page to see current data. ${message}`,
        )
      } finally {
        // A failed read must not turn a confirmed write back into a retryable draft.
        mutations.setExecution({ status: 'idle', error: null })
        mutations.discardAll()
        state.handleMutationUpdatesApplied({ [rowId]: new Set(Object.keys(values)) })
      }
      if (refreshedRow === null) {
        operationPendingRef.current = false
        state.handleRowDeleteSuccess(rowId)
      }
      return refreshedRow
    } finally {
      operationPendingRef.current = false
    }
  }
  const deleteRow = async (rowId: TableRowId) => {
    if (rowId !== state.rowEditor.activeRowId || operationPendingRef.current === true) return
    operationPendingRef.current = true
    setDeleteError(null)
    mutations.setExecution({ status: 'applying', error: null })
    try {
      await state.mutationExecutor.deleteRow(rowId)
      mutations.setExecution({ status: 'idle', error: null })
      mutations.discardAll()
      setDeleteRequestedRowId(null)
      operationPendingRef.current = false
      state.handleRowDeleteSuccess(rowId)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      mutations.setExecution({ status: 'failed', error: message })
      setDeleteError(message)
    } finally {
      operationPendingRef.current = false
    }
  }
  const canOpenInsert = state.canOpenRowEditor === true && mutationApplying === false
  useEffect(() => {
    rebaseRows(state.rows)
  }, [mutationApplying, rebaseRows, state.rows])
  const getRowStatus = useCallback(
    (row: { id: string }) =>
      state.recentlyInsertedRowIds.has(row.id) ? 'recentlyInserted' : 'default',
    [state.recentlyInsertedRowIds],
  )
  const getCellStatus = useCallback(
    (cell: { column: { id: string }; row: { id: string } }) => {
      if (cell.column.id === tableGridSelectionColumnId) {
        return 'default'
      }

      if (mutations.stagedFieldsByRowId[cell.row.id]?.has(cell.column.id) === true) {
        return 'stagedUpdate'
      }

      return state.recentlyAppliedCells[cell.row.id]?.has(cell.column.id) === true
        ? 'recentlyApplied'
        : 'default'
    },
    [mutations.stagedFieldsByRowId, state.recentlyAppliedCells],
  )
  const handleCellEditRequest = (target: { columnId: string; rowId: string }) => {
    if (mutationApplying === false) {
      const activate = () => {
        transitionApprovedRef.current = true
        state.handleCellEditRequest(target)
        transitionApprovedRef.current = false
      }
      if (target.rowId === state.rowEditor.activeRowId) activate()
      else requestTransition(activate)
    }
  }
  const resolveCellAction = useCallback(
    (target: DataGridCellTarget) => {
      const columnMeta = state.tableColumns.find((column) => column.id === target.columnId)
      const row = state.table.getRowModel().rows.find((candidate) => candidate.id === target.rowId)
      if (columnMeta === undefined || row === undefined) {
        return null
      }
      const value = resolveStagedFieldValue(
        row.original,
        mutations.stagedValuesByRowId[target.rowId],
        columnMeta.accessorKey,
      )
      return { columnMeta, value }
    },
    [mutations.stagedValuesByRowId, state.table, state.tableColumns],
  )
  const getCellActions = useCallback(
    (target: DataGridCellTarget) => {
      const resolvedCell = resolveCellAction(target)
      if (resolvedCell === null) {
        return {
          canCopy: false,
          canEdit: false,
          canExclude: false,
          canFilterBy: false,
          copyAs: [],
        }
      }
      const { columnMeta, value } = resolvedCell
      const filterColumn = columnMeta.column ?? tableIdFilterColumn
      const canEdit = state.canOpenRowEditor === true && mutationApplying === false
      return {
        canCopy: value !== undefined,
        canEdit,
        canExclude: canCreateTableFilterClauseFromValue(filterColumn, value, 'exclude'),
        canFilterBy: canCreateTableFilterClauseFromValue(filterColumn, value),
        copyAs: value instanceof Uint8Array ? (['hex', 'base64'] as const) : [],
      }
    },
    [mutationApplying, resolveCellAction, state.canOpenRowEditor],
  )
  const handleCopyCell = useCallback(
    async (target: DataGridCellTarget, format?: BinaryCopyFormat) => {
      const resolvedCell = resolveCellAction(target)
      if (resolvedCell === null) {
        return
      }
      try {
        const serializedValue = serializeCellValueForClipboard(
          resolvedCell.value,
          format ?? 'default',
        )
        await navigator.clipboard.writeText(serializedValue.text)
        toasts.success(serializedValue.toast, {
          duration: 'brief',
          id: JSON.stringify(['cell-copy', tableKey, target.rowId, target.columnId]),
        })
      } catch {
        toasts.error("Couldn't copy value")
      }
    },
    [resolveCellAction, tableKey],
  )
  const handleFilterByCell = (target: DataGridCellTarget, match: TableFilterValueMatch) => {
    const resolvedCell = resolveCellAction(target)
    if (resolvedCell === null) {
      return
    }
    const clause = createTableFilterClauseFromValue(
      resolvedCell.columnMeta.column ?? tableIdFilterColumn,
      resolvedCell.value,
      match,
    )
    if (clause !== null) {
      void state.setFilters([...state.filters, clause])
    }
  }
  const canSelectRow = useCallback(
    (rowId: string) => {
      const row = state.table.getRowModel().rows.find((candidate) => candidate.id === rowId)
      return row?.getCanSelect() === true && row.getIsSelected() === false
    },
    [state.table],
  )
  const canMutateRow = useCallback(
    (rowId: string) => {
      const rowExists = state.table.getRowModel().rows.some((candidate) => candidate.id === rowId)
      return rowExists === true && state.canMutateRows === true && mutationApplying === false
    },
    [mutationApplying, state.canMutateRows, state.table],
  )
  const handleDuplicateRow = useCallback(
    async (rowId: string) => {
      if (canMutateRow(rowId) === false || operationPendingRef.current === true) {
        return
      }
      const previousExecution = mutations.execution
      const stagedValues = mutations.stagedValuesByRowId[rowId]
      operationPendingRef.current = true
      mutations.setExecution({ status: 'applying', error: null })
      let sourceValues: Record<string, unknown>
      try {
        const row = await state.mutationExecutor.readRow(rowId)
        if (row === null) throw new Error('The row is no longer available.')
        sourceValues = Object.fromEntries(
          schemaColumns.flatMap((column) => {
            const value = resolveStagedFieldValue(row, stagedValues, column.name)
            return value === undefined ? [] : [[column.name, value]]
          }),
        )
      } catch {
        toasts.error("Couldn't load the row to duplicate")
        return
      } finally {
        mutations.setExecution(previousExecution)
        operationPendingRef.current = false
      }
      state.rowEditor.openInsert(sourceValues)
    },
    [canMutateRow, mutations, schemaColumns, state.mutationExecutor, state.rowEditor],
  )
  const handleDeleteRow = useCallback(
    (rowId: string) => {
      if (canMutateRow(rowId) === false) {
        return
      }
      requestTransition(() => {
        mutations.discardAll()
        state.handleCellEditRequest({ rowId, columnId: schemaColumns[0]?.name ?? 'id' })
        setDeleteRequestedRowId(rowId)
      })
    },
    [canMutateRow, mutations, requestTransition, schemaColumns, state],
  )
  const handleSelectRow = useCallback(
    (rowId: string) => {
      if (canSelectRow(rowId) === false) {
        return
      }
      const row = state.table.getRowModel().rows.find((candidate) => candidate.id === rowId)
      row?.toggleSelected(true)
    },
    [canSelectRow, state.table],
  )
  const handleTouchCellContextMenuOpen = useCallback(
    (target: DataGridCellTarget) => {
      const row = state.table.getRowModel().rows.find((candidate) => candidate.id === target.rowId)
      const cell = row
        ?.getVisibleCells()
        .find((candidate) => candidate.column.id === target.columnId)
      if (cell?.getCanSelect() === true && cell.getIsSelected() === false) {
        state.table.selectCellRange({
          anchorRowId: target.rowId,
          anchorColumnId: target.columnId,
          focusRowId: target.rowId,
          focusColumnId: target.columnId,
        })
      }
    },
    [state.table],
  )
  // Reset on pagination start and completion so stale offsets cannot survive content-size changes.
  const scrollResetKey = `${state.scrollResetKey}:${state.isInitialLoading === true ? 'loading' : 'ready'}`
  const handleEscape = useEffectEvent(state.handleEscape)
  const refreshPendingRef = useRef(false)
  const [refreshAnnouncement, setRefreshAnnouncement] = useState('')
  const [insertMoreEnabled, setInsertMoreEnabled] = useState(false)
  const filteredEmpty =
    state.error === null &&
    state.isInitialLoading === false &&
    state.isRefreshing === false &&
    state.rows.length === 0 &&
    state.filters.length > 0
  const unfilteredEmpty =
    state.error === null &&
    state.isInitialLoading === false &&
    state.isRefreshing === false &&
    state.rows.length === 0 &&
    state.page === 1 &&
    state.filters.length === 0
  const { page, setPage } = state
  const hasPreviousPage = state.page > 1
  const canGoToPreviousPage =
    state.isInitialLoading === false &&
    state.isPageNavigationPending === false &&
    hasPreviousPage === true
  const canGoToNextPage =
    state.isInitialLoading === false &&
    state.isPageNavigationPending === false &&
    state.hasNextPage === true
  useHotkey(
    appHotkeys.copyCell,
    (event) => {
      if (event.defaultPrevented === true || event.isComposing === true) {
        return
      }
      const focusedCell = state.table.getFocusedCell()
      if (focusedCell === undefined) {
        return
      }
      const target = { columnId: focusedCell.column.id, rowId: focusedCell.row.id }
      if (getCellActions(target).canCopy === false) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      void handleCopyCell(target)
    },
    gridHotkeyOptions,
  )
  useHotkey(
    appHotkeys.previousTablePage,
    (event) => {
      if (event.defaultPrevented === true || event.isComposing === true) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      if (canGoToPreviousPage === true) {
        setPage(page - 1)
      }
    },
    gridHotkeyOptions,
  )
  useHotkey(
    appHotkeys.nextTablePage,
    (event) => {
      if (event.defaultPrevented === true || event.isComposing === true) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      if (canGoToNextPage === true) {
        setPage(page + 1)
      }
    },
    gridHotkeyOptions,
  )
  const { canOpenRowEditor, closeRowEditor, detailPaneMode, rowEditor } = state
  const { openInsert } = rowEditor
  const closeRowEditorAndResetRepresentation = useCallback(() => {
    closeRowEditor()
  }, [closeRowEditor])
  const focusPaneReturn = useCallback(() => {
    const focusReturn = paneFocusReturnRef.current
    if (focusReturn === null) {
      return
    }
    const restoreFocus = () => {
      const target =
        focusReturn.kind === 'insert'
          ? insertRowButtonRef.current
          : (Array.from(
              gridHotkeyTargetRef.current?.querySelectorAll<HTMLElement>('[aria-label]') ?? [],
            ).find(
              (element) => element.getAttribute('aria-label') === `Select row ${focusReturn.rowId}`,
            ) ?? null)
      if (target?.isConnected === true) {
        target.focus()
      }
    }
    restoreFocus()
    if (document.querySelector('[role="dialog"] [data-slot="command"]') !== null) {
      pendingPaletteFocusReturnRef.current?.disconnect()
      const observer = new MutationObserver(() => {
        if (document.querySelector('[role="dialog"] [data-slot="command"]') === null) {
          observer.disconnect()
          pendingPaletteFocusReturnRef.current = null
          restoreFocus()
        }
      })
      pendingPaletteFocusReturnRef.current = observer
      observer.observe(document.body, { childList: true, subtree: true })
    }
  }, [])
  useEffect(() => {
    return () => pendingPaletteFocusReturnRef.current?.disconnect()
  }, [])
  useLayoutEffect(() => {
    const previousDetailPaneMode = previousDetailPaneModeRef.current
    if (detailPaneMode === 'insert') {
      pendingPaletteFocusReturnRef.current?.disconnect()
      paneFocusReturnRef.current = { kind: 'insert' }
    } else if (detailPaneMode === 'rows' && rowEditor.activeRowId !== null) {
      pendingPaletteFocusReturnRef.current?.disconnect()
      paneFocusReturnRef.current = { kind: 'row', rowId: rowEditor.activeRowId }
    } else if (previousDetailPaneMode !== 'closed') {
      setRowRepresentationState({ representation: 'details', tableKey })
      focusPaneReturn()
      paneFocusReturnRef.current = null
    }
    previousDetailPaneModeRef.current = detailPaneMode
  }, [detailPaneMode, focusPaneReturn, rowEditor.activeRowId, tableKey])
  const openInsertPane = useCallback(() => {
    setInsertMoreEnabled(false)
    openInsert()
  }, [openInsert])
  const toggleInsertPane = useCallback(() => {
    if (canOpenRowEditor === false || mutationApplying === true) {
      return
    }
    if (detailPaneMode === 'insert') {
      setInsertMoreEnabled(false)
      closeRowEditorAndResetRepresentation()
    } else {
      openInsertPane()
    }
  }, [
    canOpenRowEditor,
    closeRowEditorAndResetRepresentation,
    detailPaneMode,
    mutationApplying,
    openInsertPane,
  ])
  useHotkey(
    appHotkeys.insertRow,
    (event) => runAppHotkey(event, toggleInsertPane),
    appHotkeyOptions,
  )
  const commands = useMemo<readonly AppCommand[]>(
    () => [
      {
        group: 'Actions',
        id: 'tables.insertRow',
        label: 'Insert row',
        disabled: canOpenInsert === false,
        hotkey: appHotkeys.insertRow,
        perform: toggleInsertPane,
      },
    ],
    [canOpenInsert, toggleInsertPane],
  )
  useAppCommands(commands)
  const queryStatus =
    state.isReconnecting === true
      ? 'Reconnecting'
      : state.error !== null
        ? ''
        : state.isRefreshing === true
          ? 'Refreshing rows'
          : [
              refreshAnnouncement,
              filteredEmpty
                ? 'No rows match these filters'
                : unfilteredEmpty
                  ? 'This table is empty'
                  : '',
            ]
              .filter(Boolean)
              .join('. ')

  useEffect(() => {
    if (state.isInitialLoading === true || state.error !== null) {
      refreshPendingRef.current = false
      setRefreshAnnouncement('')
      return
    }
    if (state.isRefreshing === true) {
      refreshPendingRef.current = true
      return
    }
    if (refreshPendingRef.current === true) {
      refreshPendingRef.current = false
      setRefreshAnnouncement('Rows refreshed')
    }
  }, [state.error, state.isInitialLoading, state.isRefreshing])

  useEffect(() => {
    if (
      state.detailPaneMode === 'closed' &&
      state.hasCellSelection === false &&
      state.activeColumnId === null
    ) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        event.defaultPrevented === false &&
        event.isComposing === false
      ) {
        event.preventDefault()
        event.stopPropagation()
        handleEscape()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [state.activeColumnId, state.detailPaneMode, state.hasCellSelection])

  return (
    <>
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel>
          <Box
            height="full"
            flexDirection="column"
            overflow="hidden"
          >
            <Toolbar
              actions={
                <>
                  <Box>
                    <Tooltip.Root>
                      <Tooltip.Trigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="s"
                            aria-label="Open schema"
                            iconOnly
                            disabled={state.canInspectSchema === false}
                            onClick={() => {
                              openSchemaView(tableName)
                            }}
                          >
                            <Button.Glyph artwork={productGlyphs.schema} />
                          </Button>
                        }
                      />
                      <Tooltip.Content>Open schema</Tooltip.Content>
                    </Tooltip.Root>
                    <DataGridColumnVisibility table={state.table} />
                    <DataGridExport
                      table={state.table}
                      tableColumns={state.tableColumns}
                      tableName={tableName}
                    />
                  </Box>
                  <Tooltip.Root>
                    <Tooltip.Trigger
                      render={
                        <Button
                          ref={insertRowButtonRef}
                          type="button"
                          variant="primary"
                          size="s"
                          disabled={canOpenInsert === false}
                          focusableWhenDisabled
                          onClick={toggleInsertPane}
                        >
                          Insert row
                        </Button>
                      }
                    />
                    <Tooltip.Content>
                      Insert row{' '}
                      <KeyboardInput
                        hotkey={appHotkeys.insertRow}
                        size="small"
                      />
                    </Tooltip.Content>
                  </Tooltip.Root>
                </>
              }
              pagination={
                <TablePagination
                  hasNextPage={state.hasNextPage}
                  hasPreviousPage={hasPreviousPage}
                  loadedRowCount={state.rows.length}
                  loading={state.isInitialLoading || state.isPageNavigationPending}
                  page={state.page}
                  pageSize={state.pageSize}
                  onPageChange={state.setPage}
                  onPageSizeChange={state.setPageSize}
                />
              }
            >
              <DataGridFilterBuilder
                columns={schemaColumns}
                filters={state.filters}
                rows={state.rows}
                onFiltersChange={state.setFilters}
              />
            </Toolbar>
            <Box
              ref={gridHotkeyTargetRef}
              minHeight={0}
              flex={1}
              overflow="hidden"
            >
              <TableGridContextMenu
                canMutateRow={canMutateRow}
                canSelectRow={canSelectRow}
                getCellActions={getCellActions}
                onCopyCell={(target, format) => {
                  void handleCopyCell(target, format)
                }}
                onEditCell={handleCellEditRequest}
                onFilterByCell={handleFilterByCell}
                onDeleteRow={handleDeleteRow}
                onDuplicateRow={handleDuplicateRow}
                onSelectRow={handleSelectRow}
                onTouchCellContextMenuOpen={handleTouchCellContextMenuOpen}
              >
                {({
                  composeViewport,
                  onCellContextMenu,
                  onCellContextMenuTouchStart,
                  onRowContextMenu,
                  onRowContextMenuTouchStart,
                }) => (
                  <DataGrid.Root
                    table={state.table}
                    density="compact"
                    activeColumnId={state.activeColumnId}
                    activeRowId={state.rowEditor.activeRowId}
                    getCellStatus={getCellStatus}
                    getRowStatus={getRowStatus}
                    onCellActivate={state.handleCellActivate}
                    onCellContextMenu={onCellContextMenu}
                    onCellContextMenuTouchStart={onCellContextMenuTouchStart}
                    onCellEditRequest={handleCellEditRequest}
                    {...(state.isInitialLoading === true
                      ? {
                          reorderableColumnIds: undefined,
                          columnDragPreview: undefined,
                        }
                      : {
                          reorderableColumnIds: state.reorderableColumnIds,
                          columnDragPreview: (columnId: string) => {
                            const column = state.tableColumns.find(
                              (candidate) => candidate.id === columnId,
                            )
                            return column === undefined ? (
                              columnId
                            ) : (
                              <ColumnDragPreview column={column} />
                            )
                          },
                        })}
                    onColumnActivate={state.handleColumnActivate}
                    onRowContextMenu={onRowContextMenu}
                    onRowContextMenuTouchStart={onRowContextMenuTouchStart}
                  >
                    {composeViewport(
                      <DataGrid.Viewport scrollResetKey={scrollResetKey}>
                        <DataGrid.Table
                          aria-busy={
                            state.isInitialLoading ||
                            state.isPageNavigationPending ||
                            state.isRefreshing
                          }
                          aria-label={`${tableName} rows`}
                          statusContent={queryStatus}
                        >
                          <DataGrid.Content
                            loading={state.isInitialLoading}
                            loadingContent={
                              state.isReconnecting === true ? 'Reconnecting…' : 'Loading rows'
                            }
                            rowRendering="virtual"
                            emptyContent={
                              state.error === null ? (
                                filteredEmpty ? (
                                  <Box
                                    alignItems="center"
                                    flexDirection="column"
                                    gap="xs"
                                  >
                                    <Text color="muted">No rows match these filters</Text>
                                    <Button
                                      type="button"
                                      size="s"
                                      variant="ghost"
                                      onClick={() => {
                                        void state.setFilters([])
                                      }}
                                    >
                                      Clear filters
                                    </Button>
                                  </Box>
                                ) : unfilteredEmpty ? (
                                  <Box
                                    alignItems="center"
                                    flexDirection="column"
                                    gap="xs"
                                  >
                                    <Text color="muted">This table is empty</Text>
                                  </Box>
                                ) : null
                              ) : (
                                <Box
                                  flexDirection="column"
                                  gap="xs"
                                  role="alert"
                                >
                                  <Text
                                    color="error"
                                    variant="label"
                                  >
                                    Couldn't load rows
                                  </Text>
                                  <Text color="muted">{state.error}</Text>
                                  <Text color="muted">Reload the page to try again.</Text>
                                </Box>
                              )
                            }
                          />
                        </DataGrid.Table>
                      </DataGrid.Viewport>,
                    )}
                  </DataGrid.Root>
                )}
              </TableGridContextMenu>
            </Box>
          </Box>
        </ResizablePanel>
        {state.detailPaneMode !== 'closed' ? (
          <>
            <ResizableHandle />
            <ResizablePanel
              defaultSize={420}
              minSize={320}
              maxSize={720}
            >
              <RowEditorSidePanel
                canNavigateNext={state.rowEditor.canNavigateNext && mutationApplying === false}
                canNavigatePrevious={
                  state.rowEditor.canNavigatePrevious && mutationApplying === false
                }
                dirty={mutations.stagedCount > 0}
                onCancel={cancelRowChanges}
                deleteRequested={
                  deleteRequestedRowId === state.rowEditor.activeRowId &&
                  deleteRequestedRowId !== null
                }
                mode={state.detailPaneMode === 'insert' ? 'insert' : 'edit'}
                editedRowIds={state.rowEditor.editedRowIds}
                insertMoreEnabled={insertMoreEnabled}
                mutationDisabled={state.canMutateRows === false || mutationApplying}
                navigationLabel={state.rowEditor.navigationLabel}
                onClose={closeRowEditorAndResetRepresentation}
                onConfirmDelete={(rowIds) => {
                  const rowId = rowIds[0]
                  if (
                    rowIds.length !== 1 ||
                    rowId === undefined ||
                    rowId !== state.rowEditor.activeRowId
                  )
                    return
                  void deleteRow(rowId)
                }}
                onInsertMoreEnabledChange={setInsertMoreEnabled}
                onNavigatePrevious={state.rowEditor.goToPreviousRow}
                onNavigateNext={state.rowEditor.goToNextRow}
              >
                {deleteError === null ? null : (
                  <Text
                    color="error"
                    role="alert"
                  >
                    {deleteError}
                  </Text>
                )}
                {state.detailPaneMode === 'insert' ? (
                  <InsertRowForm
                    key={state.insertRevision}
                    rowValues={state.rowValues ?? {}}
                    schemaColumns={schemaColumns}
                    insertMoreEnabled={insertMoreEnabled}
                    saveDisabled={state.canMutateRows === false || mutationApplying}
                    onClose={() => {
                      setInsertMoreEnabled(false)
                      closeRowEditorAndResetRepresentation()
                    }}
                    onSave={async (values, options) => {
                      await state.handleInsertSave(values, options)
                      if (options.keepOpen === false) {
                        setInsertMoreEnabled(false)
                      }
                    }}
                  />
                ) : state.rowEditor.activeRowId !== null && state.rowValues !== null ? (
                  <EditRowPane
                    requestedField={state.requestedField}
                    key={`${tableKey}:${state.rowEditor.activeRowId}:${editRevision}`}
                    disabled={mutationApplying || state.canMutateRows === false}
                    onSave={saveRow}
                    onRepresentationChange={(representation) =>
                      setRowRepresentationState({ representation, tableKey })
                    }
                    representation={rowRepresentation}
                    rowId={state.rowEditor.activeRowId}
                    rowValues={state.rowValues}
                    schemaColumns={schemaColumns}
                  />
                ) : state.rowEditorQueryError !== null ? (
                  <RowEditorError message={state.rowEditorQueryError} />
                ) : state.rowEditorQueryLoading ? (
                  <RowEditorStatus label="Loading row" />
                ) : null}
              </RowEditorSidePanel>
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>
      <AlertDialog.Root
        open={
          pendingTransition !== null ||
          (routeBlocker.status === 'blocked' && mutationApplying === false)
        }
        onOpenChange={(open) => {
          if (open === false) {
            setPendingTransition(null)
            if (routeBlocker.status === 'blocked') routeBlocker.reset()
          }
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Discard changes?</AlertDialog.Title>
          <AlertDialog.Description>
            Your unsaved row changes will be discarded.
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close>Keep editing</AlertDialog.Close>
            <Button
              variant="danger"
              onClick={() => {
                if (operationPendingRef.current === true) return
                cancelRowChanges()
                transitionApprovedRef.current = true
                pendingTransition?.()
                transitionApprovedRef.current = false
                setPendingTransition(null)
                if (routeBlocker.status === 'blocked') routeBlocker.proceed()
              }}
            >
              Discard changes
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  )
}
