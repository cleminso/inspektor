import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'

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
import {
  getRuntimeResourceToken,
  useRuntimeClient,
  useRuntimeSchema,
} from '@app/runtime/runtimeProvider'
import { useConnectionContentReady } from '@app/runtime/connectionContentBoundary'
import { unknownWriteWarning } from '@inspektor/core/write'
import { ColumnDragPreview } from '@tables/grid/buildColumns'
import { DataGridColumnVisibility } from '@tables/grid/columnVisibility'
import { TableGridContextMenu } from '@tables/grid/tableGridContextMenu'
import { DataGridFilterBuilder } from '@tables/filters/dataGridFilterBuilder'
import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'
import { DataGridExport, TablePagination, Toolbar } from '@tables/grid/toolbar'
import { EditRowForm, type RowRepresentation } from '@tables/rowEditor/editForm'
import { InsertRowForm } from '@tables/rowEditor/insertForm'
import { RowEditorSidePanel } from '@tables/rowEditor/sidePane'
import { getTableColumns } from '@tables/schema/tableSchema'
import { useTableTabs } from '@tables/workspace/tabsProvider'
import { useTableViewState } from '@tables/workspace/useTableViewState'
import { useTableCellActions } from '@tables/workspace/useTableCellActions'
import { useTableRowWrites } from '@tables/workspace/useTableRowWrites'
import { useTableQueryStatus } from '@tables/workspace/useTableQueryStatus'
import { useTablePaneFocus } from '@tables/workspace/useTablePaneFocus'
import {
  TableRowChangesProvider,
  useTableRowChangeEditor,
  useTableRowChanges,
} from '@tables/rowChanges/provider'
import { useTableRowChangeWorkspace } from '@tables/rowChanges/workspaceProvider'
import type { ColumnDescriptor } from 'jazz-tools'
import type { DynamicTableRow, TableRowId } from '@tables/tableTypes'
import { appRoutes } from '@app/routing/appRoutes'
import { createTableScope } from '@tables/workspace/scope'

interface TableViewProps {
  tableName: string
}

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
  onSave: () => Promise<DynamicTableRow | null>
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
  const { draft, setFieldInput } = useTableRowChangeEditor({
    initialRowValues: sourceValues,
    rowId,
  })

  return (
    <EditRowForm
      key={rowId}
      draft={draft}
      onFieldInputChange={setFieldInput}
      requestedField={requestedField}
      disabled={disabled}
      onSave={async () => {
        const refreshedRow = await onSave()
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
  const client = useRuntimeClient()
  const wasmSchema = useRuntimeSchema()
  const { scope } = useTableTabs()
  const schemaColumns = useMemo(
    () => getTableColumns(wasmSchema, tableName),
    [tableName, wasmSchema],
  )
  const mutationScopeKey = createTableScope(scope, tableName)
  const runtimeKey = `${client === null ? 'none' : getRuntimeResourceToken(client)}:${wasmSchema === null ? 'none' : getRuntimeResourceToken(wasmSchema)}`

  return (
    <TableRowChangesProvider
      schemaColumns={schemaColumns}
      scopeKey={mutationScopeKey}
      tableName={tableName}
    >
      <TableViewContent
        key={`${mutationScopeKey}:${runtimeKey}`}
        schemaColumns={schemaColumns}
        tableKey={mutationScopeKey}
        tableName={tableName}
      />
    </TableRowChangesProvider>
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
  const mutations = useTableRowChanges()
  const mutationWorkspace = useTableRowChangeWorkspace()
  const [editRevision, setEditRevision] = useState(0)
  const [pendingTransition, setPendingTransition] = useState<(() => void) | null>(null)
  const requestTransition = useCallback(
    (action: () => void) => {
      const current = mutations.editing.getSnapshot()
      if (
        current.busy === true ||
        current.execution.status === 'applying' ||
        current.execution.status === 'retired'
      )
        return
      if (current.draftCount > 0) {
        setPendingTransition(() => action)
        return
      }
      if (current.execution.status === 'failed' && mutations.editing.discardAll() === false) {
        return
      }
      action()
    },
    [mutations.editing],
  )
  const routeBlocker = useBlocker({
    enableBeforeUnload: false,
    withResolver: true,
    shouldBlockFn: ({ current, next }) =>
      mutationWorkspace.hasPendingChanges(tableKey) === true &&
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
    retainDisabledRows: mutations.busy === true || mutations.execution.status !== 'idle',
    schemaColumns,
    draftValuesByRowId: mutations.draftValuesByRowId,
    tableKey,
    tableName,
  })
  const {
    saveRow,
    deleteRow,
    insertRow,
    duplicateRow,
    resumeWaiting,
    resumingWrite,
    deleteRequestedRowId,
    setDeleteRequestedRowId,
    deleteError,
    setDeleteError,
  } = useTableRowWrites({
    editing: mutations.editing,
    columns: schemaColumns,
    activeRowId: state.rowEditor.activeRowId,
    onApplied: state.handleMutationUpdatesApplied,
    onDeleted: state.handleRowDeleteSuccess,
    onInserted: state.handleInsertSuccess,
    onDuplicated: state.rowEditor.openInsert,
  })
  useConnectionContentReady(state.isInitialLoading === false)
  const { openSchemaView } = useTableTabs()
  const gridHotkeyTargetRef = useRef<HTMLDivElement>(null)
  const insertRowButtonRef = useRef<HTMLButtonElement>(null)
  const gridHotkeyOptions = { ...appHotkeyOptions, target: gridHotkeyTargetRef }
  const mutationApplying =
    mutations.busy === true ||
    mutations.execution.status === 'applying' ||
    mutations.execution.status === 'retired' ||
    mutations.pendingWrite !== null ||
    mutations.retired === true
  useEffect(() => {
    if (mutationApplying === true && routeBlocker.status === 'blocked') routeBlocker.reset()
  }, [mutationApplying, routeBlocker])
  const cancelRowChanges = () => {
    if (mutations.editing.discardAll() === false) return false
    setEditRevision((revision) => revision + 1)
    setDeleteError(null)
    setDeleteRequestedRowId(null)
    return true
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

      if (mutations.draftFieldsByRowId[cell.row.id]?.has(cell.column.id) === true) {
        return 'stagedUpdate'
      }

      return state.recentlyAppliedCells[cell.row.id]?.has(cell.column.id) === true
        ? 'recentlyApplied'
        : 'default'
    },
    [mutations.draftFieldsByRowId, state.recentlyAppliedCells],
  )
  const handleCellEditRequest = (target: { columnId: string; rowId: string }) => {
    if (mutationApplying === false) {
      state.handleCellEditRequest(target)
    }
  }
  const {
    getCellActions,
    handleCopyCell,
    handleFilterByCell,
    canSelectRow,
    handleSelectRow,
    handleTouchCellContextMenuOpen,
  } = useTableCellActions(state, mutations.draftValuesByRowId, mutationApplying, tableKey)
  const canMutateRow = useCallback(
    (rowId: string) => {
      const rowExists = state.table.getRowModel().rows.some((candidate) => candidate.id === rowId)
      return rowExists === true && state.canMutateRows === true && mutationApplying === false
    },
    [mutationApplying, state.canMutateRows, state.table],
  )
  const handleDuplicateRow = useCallback(
    async (rowId: string) => {
      if (canMutateRow(rowId) === true) await duplicateRow(rowId)
    },
    [canMutateRow, duplicateRow],
  )
  const handleDeleteRow = useCallback(
    (rowId: string) => {
      if (canMutateRow(rowId) === false) {
        return
      }
      requestTransition(() => {
        if (mutations.editing.discardAll() === false) return
        state.handleCellEditRequest({ rowId, columnId: schemaColumns[0]?.name ?? 'id' })
        setDeleteRequestedRowId(rowId)
      })
    },
    [canMutateRow, mutations, requestTransition, schemaColumns, state, setDeleteRequestedRowId],
  )
  // Reset on pagination start and completion so stale offsets cannot survive content-size changes.
  const scrollResetKey = `${state.scrollResetKey}:${state.isInitialLoading === true ? 'loading' : 'ready'}`
  const handleEscape = useEffectEvent(state.handleEscape)
  const [insertMoreEnabled, setInsertMoreEnabled] = useState(false)
  const { filteredEmpty, unfilteredEmpty, queryStatus } = useTableQueryStatus(state)
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
  const resetRowRepresentation = useCallback(() => {
    setRowRepresentationState({ representation: 'details', tableKey })
  }, [tableKey])
  useTablePaneFocus(
    { detailPaneMode, activeRowId: rowEditor.activeRowId },
    { grid: gridHotkeyTargetRef, insert: insertRowButtonRef },
    resetRowRepresentation,
  )
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
      {mutations.reloadRequired === true || mutations.execution.status === 'retired' ? (
        <Box role="alert">
          <Text>
            {mutations.retirementMessage ?? mutations.execution.error ?? unknownWriteWarning}
          </Text>
        </Box>
      ) : mutations.pendingWrite?.status === 'unresolved' ? (
        <Box role="status">
          <Text>Write outcome is unknown. Do not submit it again.</Text>
          <Button
            type="button"
            disabled={resumingWrite}
            onClick={resumeWaiting}
          >
            Resume waiting
          </Button>
        </Box>
      ) : null}
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
                dirty={mutations.draftCount > 0}
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
                      await insertRow(values, options, () => {
                        if (options.keepOpen === false) setInsertMoreEnabled(false)
                      })
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
                if (mutations.editing.getSnapshot().busy === true) return
                if (cancelRowChanges() === false) return
                pendingTransition?.()
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
