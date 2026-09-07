import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'

import {
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
} from '@tables/mutationLedger/provider'
import type { ColumnDescriptor } from 'jazz-tools'
import type { TableRowId } from '@tables/tableTypes'
import { TableMutationWidget } from '@tables/floatingWidget/floatingWidget'
import FieldEditorMutationWidget from '@tables/floatingWidget/fieldEditorMutationWidget'
import { getFieldReadOnlyReason } from '@tables/schema/fieldEditability'
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

interface StagedEditRowFormProps {
  onRepresentationChange: (representation: RowRepresentation) => void
  representation: RowRepresentation
  rowId: TableRowId
  rowValues: Record<string, unknown>
  schemaColumns: ColumnDescriptor[]
}

function StagedEditRowForm({
  onRepresentationChange,
  representation,
  rowId,
  rowValues,
  schemaColumns,
}: StagedEditRowFormProps): React.ReactElement {
  const draftController = useTableMutationEditorController({
    initialRowValues: rowValues,
    rowId,
  })

  return (
    <EditRowForm
      draftController={draftController}
      onRepresentationChange={onRepresentationChange}
      representation={representation}
      rowValues={rowValues}
      schemaColumns={schemaColumns}
    />
  )
}

interface StagedEditRowPaneProps {
  rowId: TableRowId
  rowValues: Record<string, unknown>
  schemaColumns: ColumnDescriptor[]
}

function StagedEditRowPane({
  rowId,
  rowValues,
  schemaColumns,
}: StagedEditRowPaneProps): React.ReactElement {
  const [representation, setRepresentation] = useState<RowRepresentation>('details')

  return (
    <StagedEditRowForm
      key={rowId}
      onRepresentationChange={setRepresentation}
      representation={representation}
      rowId={rowId}
      rowValues={rowValues}
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
  const { ledger, rebaseRows, undoDeletions } = mutations
  const stagedDeletionRowIds = useMemo(
    () =>
      new Set(
        ledger.entries.filter((entry) => entry.kind === 'delete').map((entry) => entry.rowId),
      ),
    [ledger.entries],
  )
  const state = useTableViewState({
    disabledRowIds: stagedDeletionRowIds,
    onUndoRowDeletions: undoDeletions,
    retainDisabledRows: mutations.execution.status === 'applying',
    schemaColumns,
    stagedValuesByRowId: mutations.stagedValuesByRowId,
    tableKey,
    tableName,
  })
  useConnectionContentReady(state.isInitialLoading === false)

  const { openSchemaView } = useTableTabs()
  const gridHotkeyTargetRef = useRef<HTMLDivElement>(null)
  const gridHotkeyOptions = { ...appHotkeyOptions, target: gridHotkeyTargetRef }
  const mutationApplying = mutations.execution.status === 'applying'
  const canOpenInsert = state.canOpenRowEditor === true && mutationApplying === false
  useEffect(() => {
    rebaseRows(state.rows)
  }, [mutationApplying, rebaseRows, state.rows])
  const getRowStatus = useCallback(
    (row: { id: string }) =>
      stagedDeletionRowIds.has(row.id)
        ? 'stagedDeletion'
        : state.recentlyInsertedRowIds.has(row.id)
          ? 'recentlyInserted'
          : 'default',
    [stagedDeletionRowIds, state.recentlyInsertedRowIds],
  )
  const getCellStatus = useCallback(
    (cell: { column: { id: string }; row: { id: string } }) => {
      if (cell.column.id === tableGridSelectionColumnId || stagedDeletionRowIds.has(cell.row.id)) {
        return 'default'
      }

      if (
        state.activeFieldEditorTarget?.rowId === cell.row.id &&
        state.activeFieldEditorTarget.columnId === cell.column.id
      ) {
        return 'default'
      }

      if (mutations.stagedFieldsByRowId[cell.row.id]?.has(cell.column.id) === true) {
        return 'stagedUpdate'
      }

      return state.recentlyAppliedCells[cell.row.id]?.has(cell.column.id) === true
        ? 'recentlyApplied'
        : 'default'
    },
    [
      mutations.stagedFieldsByRowId,
      stagedDeletionRowIds,
      state.activeFieldEditorTarget,
      state.recentlyAppliedCells,
    ],
  )
  const handleCellEditRequest = (target: { columnId: string; rowId: string }) => {
    if (mutationApplying === false && stagedDeletionRowIds.has(target.rowId) === false) {
      state.handleCellEditRequest(target)
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
        return { canCopy: false, canEdit: false, canFilterBy: false, copyAs: [] }
      }
      const { columnMeta, value } = resolvedCell
      const filterColumn = columnMeta.column ?? tableIdFilterColumn
      const canEdit =
        state.detailPaneMode === 'closed' &&
        state.canMutateRows === true &&
        mutationApplying === false &&
        stagedDeletionRowIds.has(target.rowId) === false &&
        columnMeta.column !== null &&
        getFieldReadOnlyReason(columnMeta.column) === null
      return {
        canCopy: value !== undefined,
        canEdit,
        canFilterBy: canCreateTableFilterClauseFromValue(filterColumn, value),
        copyAs: value instanceof Uint8Array ? (['hex', 'base64'] as const) : [],
      }
    },
    [
      mutationApplying,
      resolveCellAction,
      stagedDeletionRowIds,
      state.canMutateRows,
      state.detailPaneMode,
    ],
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
  const handleFilterByCell = (target: DataGridCellTarget) => {
    const resolvedCell = resolveCellAction(target)
    if (resolvedCell === null) {
      return
    }
    const clause = createTableFilterClauseFromValue(
      resolvedCell.columnMeta.column ?? tableIdFilterColumn,
      resolvedCell.value,
    )
    if (clause !== null) {
      void state.setFilters([...state.filters, clause])
    }
  }
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
  const activeFieldColumn =
    state.activeFieldEditorTarget === null
      ? null
      : (state.tableColumns.find((column) => column.id === state.activeFieldEditorTarget?.columnId)
          ?.column ?? null)
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
  const canGoToPreviousPage = state.isInitialLoading === false && hasPreviousPage === true
  const canGoToNextPage = state.isInitialLoading === false && state.hasNextPage === true
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
      closeRowEditor()
    } else {
      openInsertPane()
    }
  }, [canOpenRowEditor, closeRowEditor, detailPaneMode, mutationApplying, openInsertPane])
  useHotkey(
    appHotkeys.insertRow,
    (event) => runAppHotkey(event, toggleInsertPane),
    appHotkeyOptions,
  )
  const commands = useMemo<readonly AppCommand[]>(
    () => [
      {
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
    state.error !== null
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
      state.activeFieldEditorTarget === null &&
      state.hasCellSelection === false &&
      state.activeColumnId === null
    ) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && event.defaultPrevented === false) {
        handleEscape()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    state.activeColumnId,
    state.activeFieldEditorTarget,
    state.detailPaneMode,
    state.hasCellSelection,
  ])

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
                  loading={state.isInitialLoading}
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
                getCellActions={getCellActions}
                onCopyCell={(target, format) => {
                  void handleCopyCell(target, format)
                }}
                onEditCell={handleCellEditRequest}
                onFilterByCell={handleFilterByCell}
                onTouchCellContextMenuOpen={handleTouchCellContextMenuOpen}
                revertField={mutations.revertField}
                revertRowUpdate={mutations.revertRowUpdate}
                stagedDeletionRowIds={stagedDeletionRowIds}
                stagedFieldsByRowId={mutations.stagedFieldsByRowId}
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
                    reorderableColumnIds={state.reorderableColumnIds}
                    density="compact"
                    activeColumnId={state.activeColumnId}
                    activeRowId={state.rowEditor.activeRowId}
                    focusRequest={state.cellFocusRequest}
                    getCellStatus={getCellStatus}
                    getRowStatus={getRowStatus}
                    onCellActivate={state.handleCellActivate}
                    onCellContextMenu={onCellContextMenu}
                    onCellContextMenuTouchStart={onCellContextMenuTouchStart}
                    onCellEditRequest={handleCellEditRequest}
                    columnDragPreview={(columnId) => {
                      const column = state.tableColumns.find(
                        (candidate) => candidate.id === columnId,
                      )
                      return column === undefined ? columnId : <ColumnDragPreview column={column} />
                    }}
                    onColumnActivate={state.handleColumnActivate}
                    onRowContextMenu={onRowContextMenu}
                    onRowContextMenuTouchStart={onRowContextMenuTouchStart}
                  >
                    {composeViewport(
                      <DataGrid.Viewport scrollResetKey={scrollResetKey}>
                        <DataGrid.Table
                          aria-busy={state.isInitialLoading || state.isRefreshing}
                          aria-label={`${tableName} rows`}
                          statusContent={queryStatus}
                        >
                          <DataGrid.Content
                            loading={state.isInitialLoading}
                            loadingContent="Loading rows"
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
                                    <Button
                                      type="button"
                                      size="s"
                                      variant="primary"
                                      disabled={canOpenInsert === false}
                                      onClick={openInsertPane}
                                    >
                                      Insert row
                                    </Button>
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
                                  <Text color="muted">
                                    Check the connection, then reload the page to try again.
                                  </Text>
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
                canNavigateNext={state.rowEditor.canNavigateNext}
                canNavigatePrevious={state.rowEditor.canNavigatePrevious}
                mode={state.detailPaneMode === 'insert' ? 'insert' : 'edit'}
                editedRowIds={state.rowEditor.editedRowIds}
                insertMoreEnabled={insertMoreEnabled}
                mutationDisabled={state.canMutateRows === false || mutationApplying}
                navigationLabel={state.rowEditor.navigationLabel}
                onClose={state.closeRowEditor}
                onConfirmDelete={(rowIds) => {
                  mutations.stageDeletions(rowIds)
                  state.handleRowsStagedForDeletion(rowIds)
                }}
                onInsertMoreEnabledChange={setInsertMoreEnabled}
                onNavigatePrevious={state.rowEditor.goToPreviousRow}
                onNavigateNext={state.rowEditor.goToNextRow}
              >
                {mutationApplying && state.detailPaneMode !== 'insert' ? (
                  <RowEditorStatus label="Applying changes" />
                ) : state.detailPaneMode === 'insert' ? (
                  <InsertRowForm
                    rowValues={state.rowValues ?? {}}
                    schemaColumns={schemaColumns}
                    insertMoreEnabled={insertMoreEnabled}
                    saveDisabled={state.canMutateRows === false || mutationApplying}
                    onClose={() => {
                      setInsertMoreEnabled(false)
                      state.closeRowEditor()
                    }}
                    onSave={async (values, options) => {
                      await state.handleInsertSave(values, options)
                      if (options.keepOpen === false) {
                        setInsertMoreEnabled(false)
                      }
                    }}
                  />
                ) : state.rowEditor.activeRowId !== null && state.rowValues !== null ? (
                  <StagedEditRowPane
                    key={tableKey}
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
      {state.detailPaneMode === 'closed' &&
      state.activeFieldEditorTarget !== null &&
      state.activeFieldEditorRowValues !== null &&
      activeFieldColumn !== null ? (
        <FieldEditorMutationWidget
          key={`${state.activeFieldEditorTarget.rowId}:${state.activeFieldEditorTarget.columnId}`}
          column={activeFieldColumn}
          rowId={state.activeFieldEditorTarget.rowId}
          rowValues={state.activeFieldEditorRowValues}
          onClose={state.handleFieldEditorCancel}
          onComplete={state.handleFieldEditorComplete}
        />
      ) : (
        <TableMutationWidget
          executor={state.mutationExecutor}
          onAppliedUpdates={state.handleMutationUpdatesApplied}
          onApplySuccess={state.handleMutationApplySuccess}
        />
      )}
    </>
  )
}
