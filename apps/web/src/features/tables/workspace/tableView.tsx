import { Suspense, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'

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
} from '@inspector/ds'
import { useHotkey } from '@tanstack/react-hotkeys'

import { isAppHotkeyInteractionLayer, useAppCommands, type AppCommand } from '@app/hotkeys/appHotkeys'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'
import { productGlyphs } from '@app/icons/productGlyphs'
import { useInspectorSessionState, useRuntimeSchema } from '@app/providers/inspectorProvider'
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
import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'
import { TablePagination, Toolbar } from '@tables/grid/toolbar'
import {
  EditRowForm,
  InsertRowForm,
  preloadRowEditorForms,
} from '@tables/rowEditor/rowEditorModules'
import { RowEditorSidePanel } from '@tables/rowEditor/sidePane'
import { getTableColumns } from '@tables/schema/tableSchema'
import { getTableViewportScrollResetKey } from '@tables/workspace/tableViewport'
import { useTableTabs } from '@tables/workspace/tabsProvider'
import { useTableViewState } from '@tables/workspace/useTableViewState'
import {
  TableMutationLedgerProvider,
  useTableMutationEditorController,
  useTableMutationLedger,
  type ScopedTableMutationLedger,
} from '@tables/mutationLedger/provider'
import type { ColumnDescriptor } from 'jazz-tools'
import type { TableRowId } from '@tables/tableTypes'
import { TableMutationWidget } from '@tables/floatingWidget/floatingWidget'
import { FieldEditorMutationWidget } from '@tables/floatingWidget/fieldEditorMutationWidgetModules'
import type { SpreadsheetCompletionDirection } from '@tables/grid/inlineEditing'
import { getFieldReadOnlyReason } from '@tables/rowEditor/mutation/parsing'
import {
  createTableMutationScopeKey,
  createTableMutationWorkspaceScope,
} from '@tables/mutationLedger/scope'

interface TableViewProps {
  tableName: string
}

function RowEditorFormFallback(): React.ReactElement {
  return (
    <Box
      height="full"
      alignItems="center"
      justifyContent="center"
      role="status"
      aria-live="polite"
    >
      <Text color="muted">Loading editor</Text>
    </Box>
  )
}

interface StagedEditRowFormProps {
  rowId: TableRowId
  rowValues: Record<string, unknown>
  schemaColumns: ColumnDescriptor[]
}

function StagedEditRowForm({
  rowId,
  rowValues,
  schemaColumns,
}: StagedEditRowFormProps): React.ReactElement {
  const draftController = useTableMutationEditorController({
    initialRowValues: rowValues,
    rowId,
    schemaColumns,
  })

  return (
    <EditRowForm
      draftController={draftController}
      rowValues={rowValues}
      schemaColumns={schemaColumns}
      targetRowId={rowId}
    />
  )
}

interface StagedFieldEditorMutationWidgetProps {
  column: ColumnDescriptor
  onCancel: () => void
  onComplete: (direction: SpreadsheetCompletionDirection) => void
  rowId: TableRowId
  rowValues: Record<string, unknown>
  schemaColumns: ColumnDescriptor[]
}

function StagedFieldEditorMutationWidget({
  column,
  onCancel,
  onComplete,
  rowId,
  rowValues,
  schemaColumns,
}: StagedFieldEditorMutationWidgetProps): React.ReactElement {
  const controller = useTableMutationEditorController({
    initialRowValues: rowValues,
    rowId,
    schemaColumns,
  })

  return (
    <Suspense fallback={<RowEditorFormFallback />}>
      <FieldEditorMutationWidget
        column={column}
        controller={controller}
        onClose={onCancel}
        onComplete={onComplete}
      />
    </Suspense>
  )
}

export function TableView({ tableName }: TableViewProps): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspectorSessionState()
  const wasmSchema = useRuntimeSchema()
  const schemaColumns = useMemo(
    () => getTableColumns(wasmSchema, tableName),
    [tableName, wasmSchema],
  )
  const mutationScopeKey = createTableMutationScopeKey(
    createTableMutationWorkspaceScope({
      branch: currentBranch,
      connectionId: currentConnectionId,
      schemaHash: currentSchemaHash,
    }),
    tableName,
  )

  return (
    <TableMutationLedgerProvider
      schemaColumns={schemaColumns}
      scopeKey={mutationScopeKey}
    >
      <TableViewStatefulContent tableName={tableName} />
    </TableMutationLedgerProvider>
  )
}

function TableViewStatefulContent({ tableName }: TableViewProps): React.ReactElement {
  const mutations = useTableMutationLedger()
  const { ledger, undoDeletions } = mutations
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
    stagedValuesByRowId: mutations.stagedValuesByRowId,
    tableName,
  })

  return (
    <TableViewContent
      mutations={mutations}
      stagedDeletionRowIds={stagedDeletionRowIds}
      state={state}
      tableName={tableName}
    />
  )
}

function TableViewContent({
  mutations,
  stagedDeletionRowIds,
  state,
  tableName,
}: {
  mutations: ScopedTableMutationLedger
  stagedDeletionRowIds: ReadonlySet<TableRowId>
  state: ReturnType<typeof useTableViewState>
  tableName: string
}): React.ReactElement {
  const { openSchemaView } = useTableTabs()
  const gridHotkeyTargetRef = useRef<HTMLDivElement>(null)
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
  const handleCellEditRequest = useCallback(
    (target: { columnId: string; rowId: string }) => {
      if (stagedDeletionRowIds.has(target.rowId) === false) {
        state.handleCellEditRequest(target)
      }
    },
    [stagedDeletionRowIds, state],
  )
  const resolveCellAction = useCallback(
    (target: DataGridCellTarget) => {
      const columnMeta = state.tableColumns.find((column) => column.id === target.columnId)
      const row = state.table.getRowModel().rows.find((candidate) => candidate.id === target.rowId)
      if (columnMeta === undefined || row === undefined) {
        return null
      }
      const stagedRowValues = mutations.stagedValuesByRowId[target.rowId]
      const value =
        stagedRowValues !== undefined && Object.hasOwn(stagedRowValues, columnMeta.accessorKey)
          ? stagedRowValues[columnMeta.accessorKey]
          : row.original[columnMeta.accessorKey]
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
    [resolveCellAction, stagedDeletionRowIds, state.canMutateRows, state.detailPaneMode],
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
          id: JSON.stringify(['cell-copy', state.tableKey, target.rowId, target.columnId]),
        })
      } catch {
        toasts.error("Couldn't copy value")
      }
    },
    [resolveCellAction, state.tableKey],
  )
  const handleFilterByCell = useCallback(
    (target: DataGridCellTarget) => {
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
    },
    [resolveCellAction, state],
  )
  const handleTouchCellContextMenuOpen = useCallback(
    (target: DataGridCellTarget) => {
      const row = state.table.getRowModel().rows.find((candidate) => candidate.id === target.rowId)
      const cell = row?.getVisibleCells().find((candidate) => candidate.column.id === target.columnId)
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
  const scrollResetKey = getTableViewportScrollResetKey(state)
  const handleEscape = useEffectEvent(state.handleEscape)
  const refreshPendingRef = useRef(false)
  const [refreshAnnouncement, setRefreshAnnouncement] = useState('')
  const [insertMoreEnabled, setInsertMoreEnabled] = useState(false)
  const activeFieldRow =
    state.activeFieldEditorTarget === null
      ? undefined
      : state.table
          .getRowModel()
          .rows.find((row) => row.id === state.activeFieldEditorTarget?.rowId)
  const activeFieldColumn =
    state.activeFieldEditorTarget === null
      ? null
      : (state.tableColumns.find((column) => column.id === state.activeFieldEditorTarget?.columnId)
          ?.column ?? null)
  const filteredEmpty =
    state.error === null &&
    state.isInitialLoading === false &&
    state.isRefreshing === false &&
    state.loadedRowCount === 0 &&
    state.filters.length > 0
  const unfilteredEmpty =
    state.error === null &&
    state.isInitialLoading === false &&
    state.isRefreshing === false &&
    state.loadedRowCount === 0 &&
    state.page === 1 &&
    state.filters.length === 0
  const { page, setPage } = state
  const canGoToPreviousPage = state.isInitialLoading === false && state.hasPreviousPage === true
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
    {
      ignoreInputs: true,
      preventDefault: false,
      stopPropagation: false,
      target: gridHotkeyTargetRef,
    },
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
    {
      ignoreInputs: true,
      preventDefault: false,
      stopPropagation: false,
      target: gridHotkeyTargetRef,
    },
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
    {
      ignoreInputs: true,
      preventDefault: false,
      stopPropagation: false,
      target: gridHotkeyTargetRef,
    },
  )
  const { canOpenRowEditor, detailPaneMode, handleRowEditorOpenChange, rowEditor } = state
  const { openInsert } = rowEditor
  const openInsertPane = useCallback(() => {
    setInsertMoreEnabled(false)
    openInsert()
  }, [openInsert])
  const toggleInsertPane = useCallback(() => {
    if (canOpenRowEditor === false) {
      return
    }
    if (detailPaneMode === 'insert') {
      setInsertMoreEnabled(false)
      handleRowEditorOpenChange(false)
    } else {
      openInsertPane()
    }
  }, [canOpenRowEditor, detailPaneMode, handleRowEditorOpenChange, openInsertPane])
  useHotkey(
    appHotkeys.insertRow,
    (event) => {
      if (
        event.defaultPrevented === true ||
        event.isComposing === true ||
        event.repeat === true ||
        isAppHotkeyInteractionLayer(event.target)
      ) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      toggleInsertPane()
    },
    {
      ignoreInputs: true,
      preventDefault: false,
      stopPropagation: false,
    },
  )
  const commands = useMemo<readonly AppCommand[]>(
    () => [
      {
        id: 'tables.insertRow',
        label: 'Insert row',
        disabled: state.canOpenRowEditor === false,
        hotkey: appHotkeys.insertRow,
        perform: toggleInsertPane,
      },
    ],
    [state.canOpenRowEditor, toggleInsertPane],
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
    if (state.canOpenRowEditor === true) {
      preloadRowEditorForms()
    }
  }, [state.canOpenRowEditor])

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
                  </Box>
                  <Tooltip.Root>
                    <Tooltip.Trigger
                      render={
                        <Button
                          type="button"
                          variant="primary"
                          size="s"
                          disabled={state.canOpenRowEditor === false}
                          focusableWhenDisabled
                          onClick={toggleInsertPane}
                        >
                          Insert row
                        </Button>
                      }
                    />
                    <Tooltip.Content>
                      Insert row <KeyboardInput hotkey={appHotkeys.insertRow} size="small" />
                    </Tooltip.Content>
                  </Tooltip.Root>
                </>
              }
              pagination={
                <TablePagination
                  hasNextPage={state.hasNextPage}
                  hasPreviousPage={state.hasPreviousPage}
                  loadedRowCount={state.loadedRowCount}
                  loading={state.isInitialLoading}
                  page={state.page}
                  pageSize={state.pageSize}
                  onPageChange={state.setPage}
                  onPageSizeChange={state.setPageSize}
                />
              }
            >
              <DataGridFilterBuilder
                columns={state.schemaColumns}
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
              data-hotkey-scope="table-grid"
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
                                      Clear
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
                                      disabled={state.canOpenRowEditor === false}
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
                activeColumnNumber={state.rowEditor.activeColumnNumber}
                activePageRowNumber={state.rowEditor.activePageRowNumber}
                mode={state.detailPaneMode === 'insert' ? 'insert' : 'edit'}
                editedRowIds={state.rowEditor.editedRowIds}
                insertMoreEnabled={insertMoreEnabled}
                mutationDisabled={state.canMutateRows === false}
                activeRowIndex={state.rowEditor.activeRowIndex}
                onClose={state.handleRowEditorCancel}
                onConfirmDelete={(rowIds) => {
                  mutations.dispatch({ type: 'deleteRows', rowIds })
                  state.handleRowsStagedForDeletion(rowIds)
                }}
                onInsertMoreEnabledChange={setInsertMoreEnabled}
                onNavigatePrevious={state.rowEditor.goToPreviousRow}
                onNavigateNext={state.rowEditor.goToNextRow}
              >
                <Suspense fallback={<RowEditorFormFallback />}>
                  {state.detailPaneMode === 'insert' ? (
                    <InsertRowForm
                      key={`${tableName}:insert`}
                      rowValues={state.rowValues ?? {}}
                      schemaColumns={state.schemaColumns}
                      insertMoreEnabled={insertMoreEnabled}
                      saveDisabled={state.canMutateRows === false}
                      onDiscard={() => {
                        setInsertMoreEnabled(false)
                        state.handleRowEditorCancel()
                      }}
                      onSave={async (values, options) => {
                        await state.handleInsertSave(values, options)
                        if (options.keepOpen === false) {
                          setInsertMoreEnabled(false)
                        }
                      }}
                    />
                  ) : state.rowEditor.activeRowId !== null && state.rowValues !== null ? (
                    <StagedEditRowForm
                      key={`${tableName}:${state.rowEditor.activeRowId}`}
                      rowId={state.rowEditor.activeRowId}
                      rowValues={state.rowValues}
                      schemaColumns={state.schemaColumns}
                    />
                  ) : (
                    <EditRowForm
                      key={`${tableName}:${state.rowEditor.activeRowId ?? 'none'}`}
                      rowValues={state.rowValues}
                      schemaColumns={state.schemaColumns}
                      targetRowId={state.rowEditor.activeRowId}
                    />
                  )}
                </Suspense>
              </RowEditorSidePanel>
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>
      {state.detailPaneMode === 'closed' &&
      state.activeFieldEditorTarget !== null &&
      activeFieldRow !== undefined &&
      activeFieldColumn !== null ? (
        <StagedFieldEditorMutationWidget
          key={`${state.activeFieldEditorTarget.rowId}:${state.activeFieldEditorTarget.columnId}`}
          column={activeFieldColumn}
          rowId={state.activeFieldEditorTarget.rowId}
          rowValues={activeFieldRow.original}
          schemaColumns={state.schemaColumns}
          onCancel={state.handleFieldEditorCancel}
          onComplete={state.handleFieldEditorComplete}
        />
      ) : (
        <TableMutationWidget
          executor={state.mutationExecutor}
          onApplySuccess={state.handleMutationApplySuccess}
        />
      )}
    </>
  )
}
