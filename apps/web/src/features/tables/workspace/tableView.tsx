import { Suspense, useEffect, useEffectEvent, useRef, useState } from 'react'

import {
  Box,
  Button,
  DataGrid,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Text,
  Tooltip,
} from '@inspector/ds'

import { productGlyphs } from '@app/icons/productGlyphs'
import { ColumnDragPreview } from '@tables/grid/buildColumns'
import { DataGridColumnVisibility } from '@tables/grid/columnVisibility'
import { TablePagination, Toolbar } from '@tables/grid/toolbar'
import {
  EditRowForm,
  InsertRowForm,
  preloadRowEditorForms,
} from '@tables/rowEditor/rowEditorModules'
import { RowEditorSidePanel } from '@tables/rowEditor/sidePane'
import { getTableViewportScrollResetKey } from '@tables/workspace/tableViewport'
import { useTableTabs } from '@tables/workspace/tabsProvider'
import { useTableViewState } from '@tables/workspace/useTableViewState'

interface TableViewProps {
  tableName: string
}

function RowEditorFormFallback(): React.ReactElement {
  return (
    <Box height="full" alignItems="center" justifyContent="center" role="status" aria-live="polite">
      <Text color="muted">Loading editor</Text>
    </Box>
  )
}

export function TableView({ tableName }: TableViewProps): React.ReactElement {
  const { openSchemaView } = useTableTabs()
  const state = useTableViewState({
    tableName,
  })
  const scrollResetKey = getTableViewportScrollResetKey(state)
  const handleEscape = useEffectEvent(state.handleEscape)
  const refreshPendingRef = useRef(false)
  const [refreshAnnouncement, setRefreshAnnouncement] = useState('')
  const filteredEmpty =
    state.error === null &&
    state.isInitialLoading === false &&
    state.isRefreshing === false &&
    state.loadedRowCount === 0 &&
    state.filters.length > 0
  const queryStatus =
    state.error !== null
      ? ''
      : state.isRefreshing === true
        ? 'Refreshing rows'
        : [refreshAnnouncement, filteredEmpty ? 'No rows match these filters' : '']
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
  }, [state.activeColumnId, state.detailPaneMode, state.hasCellSelection])

  return (
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
                <Button
                  type="button"
                  variant="primary"
                  size="s"
                  disabled={state.canOpenRowEditor === false}
                  onClick={() => {
                    if (state.detailPaneMode === 'insert') {
                      state.handleRowEditorOpenChange(false)
                    } else {
                      state.rowEditor.openInsert()
                    }
                  }}
                >
                  Insert row
                </Button>
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
          />
          <Box
            minHeight={0}
            flex={1}
            overflow="hidden"
          >
            <DataGrid.Root
              table={state.table}
              reorderableColumnIds={state.reorderableColumnIds}
              density="compact"
              activeColumnId={state.activeColumnId}
              activeRowId={state.rowEditor.activeRowId}
              onCellActivate={state.handleCellActivate}
              columnDragPreview={(columnId) => {
                const column = state.tableColumns.find((candidate) => candidate.id === columnId)
                return column === undefined ? columnId : <ColumnDragPreview column={column} />
              }}
              onColumnActivate={state.handleColumnActivate}
            >
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
                          'No rows match these filters'
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
              </DataGrid.Viewport>
            </DataGrid.Root>
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
              mode={state.detailPaneMode === 'insert' ? 'insert' : 'edit'}
              draftTransitionPending={state.draftTransition.isPending}
              draftTransitionSaving={state.draftTransition.isSaving}
              editedRowIds={state.rowEditor.editedRowIds}
              activeRowIndex={state.rowEditor.activeRowIndex}
              onDiscardAndContinue={state.draftTransition.discardAndContinue}
              onKeepEditing={state.draftTransition.keepEditing}
              onNavigatePrevious={state.rowEditor.goToPreviousRow}
              onNavigateNext={state.rowEditor.goToNextRow}
            >
              <Suspense fallback={<RowEditorFormFallback />}>
                {state.detailPaneMode === 'insert' ? (
                  <InsertRowForm
                    key={`${tableName}:insert`}
                    saveDisabled={state.canMutateRows === false}
                    rowValues={state.rowValues ?? {}}
                    schemaColumns={state.schemaColumns}
                    onCancel={() => {
                      state.handleRowEditorCancel()
                    }}
                    onDirtyChange={state.handleRowDraftDirtyChange}
                    onSave={state.handleInsertSave}
                  />
                ) : (
                  <EditRowForm
                    key={`${tableName}:${state.rowEditor.activeRowId ?? 'none'}`}
                    rowValues={state.rowValues}
                    schemaColumns={state.schemaColumns}
                    targetRowId={state.rowEditor.activeRowId}
                    onCancel={() => {
                      state.handleRowEditorCancel()
                    }}
                    onDelete={state.handleDelete}
                    onDirtyChange={state.handleRowDraftDirtyChange}
                    onSave={state.handleEditSave}
                  />
                )}
              </Suspense>
            </RowEditorSidePanel>
          </ResizablePanel>
        </>
      ) : null}
    </ResizablePanelGroup>
  )
}
