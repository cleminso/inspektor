import { lazy, Suspense, useEffect, useEffectEvent } from "react";

import {
  Box,
  Button,
  DataGrid,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Text,
} from "@inspector/ds";
import { Layers } from "lucide-react";

import { ColumnDragPreview } from "@tables/grid/buildColumns";
import { DataGridColumnVisibility } from "@tables/grid/columnVisibility";
import { Toolbar } from "@tables/grid/toolbar";
import { useTableExplorerSearchParams } from "@tables/routing/useTableSearchParams";
import { RowEditorSidePanel } from "@tables/rowEditor/sidePane";
import { useTableViewState } from "@tables/workspace/useTableViewState";

interface TableViewProps {
  tableName: string;
}

/**
 * Row forms and their editor integrations are optional until the detail pane opens. Keeping them
 * behind this boundary preserves a usable base table without making editor code static work.
 */
const EditRowForm = lazy(async () => {
  const module = await import("@tables/rowEditor/editForm");

  return { default: module.EditRowForm };
});

const InsertRowForm = lazy(async () => {
  const module = await import("@tables/rowEditor/insertForm");

  return { default: module.InsertRowForm };
});

export function TableView({ tableName }: TableViewProps): React.ReactElement {
  const { openSchema } = useTableExplorerSearchParams();
  const state = useTableViewState({
    tableName,
  });
  const handleEscape = useEffectEvent(state.handleEscape);

  useEffect(() => {
    if (
      state.detailPaneMode === "closed" &&
      state.activeCell === null &&
      state.activeColumnId === null
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && event.defaultPrevented === false) {
        handleEscape();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.activeCell, state.activeColumnId, state.detailPaneMode]);

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel>
        <Box height="full" flexDirection="column" overflow="hidden">
          <Toolbar
            actions={
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="s"
                  aria-label="Open schema"
                  iconOnly
                  title="Open schema"
                  onClick={() => {
                    void openSchema();
                  }}
                >
                  <Layers aria-hidden="true" size={14} />
                </Button>
                <DataGridColumnVisibility table={state.table} />
                <Button
                  type="button"
                  variant="primary"
                  size="s"
                  onClick={() => {
                    if (state.detailPaneMode === "insert") {
                      state.handleRowEditorOpenChange(false);
                    } else {
                      state.rowEditor.openInsert();
                    }
                  }}
                >
                  Insert row
                </Button>
              </>
            }
          />
          <Box minHeight={0} flex={1} overflow="hidden">
            <DataGrid.Root
              table={state.table}
              columnOrder={state.columnOrder}
              density="compact"
              activeCell={state.activeCell}
              activeColumnId={state.activeColumnId}
              activeRowId={state.rowEditor.activeRowId}
              selectedCells={state.selectedCells}
              onCellActivate={state.handleCellActivate}
              columnDragPreview={(columnId) => {
                const column = state.tableColumns.find((candidate) => candidate.id === columnId);
                return column === undefined ? columnId : <ColumnDragPreview column={column} />;
              }}
              onColumnActivate={state.handleColumnActivate}
              onColumnOrderChange={state.setColumnOrder}
            >
              <DataGrid.Viewport>
                <DataGrid.Table aria-label={`${tableName} rows`}>
                  <DataGrid.Content
                    loading={state.isInitialLoading}
                    loadingContent="Loading rows"
                    emptyContent={
                      state.filters.length > 0
                        ? "No rows match these filters"
                        : "This table has no rows"
                    }
                  />
                </DataGrid.Table>
              </DataGrid.Viewport>
              <DataGrid.Footer>
                <Text color="muted" variant="caption">
                  {state.isRefreshing === true
                    ? "Refreshing rows"
                    : `${state.loadedRowCount} rows loaded`}
                </Text>
                {state.hasMore === true ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="s"
                    disabled={state.isRefreshing}
                    loading={state.isFetchingMore}
                    onClick={state.fetchMore}
                  >
                    Load more
                  </Button>
                ) : null}
              </DataGrid.Footer>
            </DataGrid.Root>
          </Box>
        </Box>
      </ResizablePanel>
      {state.detailPaneMode !== "closed" ? (
        <>
          <ResizableHandle />
          <ResizablePanel defaultSize={420} minSize={320} maxSize={720}>
            <RowEditorSidePanel
              mode={state.detailPaneMode === "insert" ? "insert" : "edit"}
              draftTransitionPending={state.draftTransition.isPending}
              draftTransitionSaving={state.draftTransition.isSaving}
              editedRowIds={state.rowEditor.editedRowIds}
              activeRowIndex={state.rowEditor.activeRowIndex}
              onDiscardAndContinue={state.draftTransition.discardAndContinue}
              onKeepEditing={state.draftTransition.keepEditing}
              onNavigatePrevious={state.rowEditor.goToPreviousRow}
              onNavigateNext={state.rowEditor.goToNextRow}
            >
              <Suspense
                fallback={
                  <Box width="full" padding="l">
                    <Text color="muted" variant="caption">
                      Loading row editor
                    </Text>
                  </Box>
                }
              >
                {state.detailPaneMode === "insert" ? (
                  <InsertRowForm
                    key={`${tableName}:insert`}
                    rowValues={state.rowValues ?? {}}
                    schemaColumns={state.schemaColumns}
                    onCancel={() => {
                      state.handleRowEditorCancel();
                    }}
                    onDirtyChange={state.handleRowDraftDirtyChange}
                    onSave={state.handleInsertSave}
                  />
                ) : (
                  <EditRowForm
                    key={`${tableName}:${state.rowEditor.activeRowId ?? "none"}`}
                    rowValues={state.rowValues}
                    schemaColumns={state.schemaColumns}
                    targetRowId={state.rowEditor.activeRowId}
                    onCancel={() => {
                      state.handleRowEditorCancel();
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
  );
}
