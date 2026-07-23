import { useEffect, useEffectEvent, useState } from "react";

import {
  Box,
  Button,
  DataTable,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Text,
} from "@inspector/ds";

import { ActionsBar } from "@/components/table-explorer/actionsBar";
import { DataTableColumnVisibility } from "@/components/table-explorer/data/dataTableColumnVisibility";
import { EditRowForm } from "@/components/table-explorer/data/editRowForm";
import { InsertRowForm } from "@/components/table-explorer/data/insertRowForm";
import { RowEditorSidePanel } from "@/components/table-explorer/data/rowEditorSidePanel";
import { TableFilter } from "@/components/table-explorer/data/tableFilter";
import { useDataViewState } from "@/components/table-explorer/data/useDataViewState";

interface DataViewProps {
  tableName: string;
}

export function DataView({ tableName }: DataViewProps): React.ReactElement {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const state = useDataViewState({
    tableName,
  });
  const handleEscape = useEffectEvent(state.handleEscape);

  useEffect(() => {
    if (state.rowEditor.isOpen === false) {
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
  }, [state.rowEditor.isOpen]);

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel>
        <div className="flex h-full flex-col overflow-hidden">
          <ActionsBar
            isFilterOpen={isFilterOpen}
            filterCount={state.filters.length}
            onFilterOpenChange={setIsFilterOpen}
          >
            <ActionsBar.Leading>
              <Button
                type="button"
                variant="primary"
                size="m"
                onClick={() => {
                  if (state.rowEditor.isOpen === true && state.rowEditor.mode === "insert") {
                    state.handleRowEditorOpenChange(false);
                  } else {
                    state.rowEditor.openInsert();
                  }
                }}
              >
                Insert row
              </Button>
            </ActionsBar.Leading>
            <ActionsBar.Trailing>
              <DataTableColumnVisibility table={state.table} />
            </ActionsBar.Trailing>
          </ActionsBar>
          {isFilterOpen === true ? (
            <TableFilter
              schemaColumns={state.schemaColumns}
              filters={state.filters}
              onFiltersChange={state.setFilters}
              onClear={() => {
                void state.setFilters([]);
                setIsFilterOpen(false);
              }}
              onRequestClose={() => {
                setIsFilterOpen(false);
              }}
            />
          ) : null}
          <Box minHeight={0} flex={1} overflow="hidden">
            <DataTable.Root
              table={state.table}
              columnOrder={state.columnOrder}
              density="compact"
              activeCell={state.activeCell}
              activeColumnId={state.activeColumnId}
              activeRowId={state.rowEditor.activeRowId}
              onCellActivate={state.handleCellActivate}
              onColumnActivate={state.handleColumnActivate}
              onColumnOrderChange={state.setColumnOrder}
              onRowActivate={state.handleRowActivate}
            >
              <DataTable.Viewport>
                <DataTable.Table aria-label={`${tableName} rows`}>
                  <DataTable.Content
                    loading={state.isFetchingMore === true && state.loadedRowCount === 0}
                    loadingContent="Loading rows"
                    emptyContent={
                      state.filters.length > 0
                        ? "No rows match these filters"
                        : "This table has no rows"
                    }
                  />
                </DataTable.Table>
              </DataTable.Viewport>
              <DataTable.Footer>
                <Text color="muted" variant="caption">
                  {state.loadedRowCount} rows loaded
                </Text>
                {state.hasMore === true ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="s"
                    loading={state.isFetchingMore}
                    onClick={state.fetchMore}
                  >
                    Load more
                  </Button>
                ) : null}
              </DataTable.Footer>
            </DataTable.Root>
          </Box>
        </div>
      </ResizablePanel>
      {state.rowEditor.isOpen === true ? (
        <>
          <ResizableHandle />
          <ResizablePanel defaultSize={420} minSize={320} maxSize={720}>
            <RowEditorSidePanel
              mode={state.rowEditor.mode === "insert" ? "insert" : "edit"}
              editedRowIds={state.rowEditor.editedRowIds}
              activeRowIndex={state.rowEditor.activeRowIndex}
              onNavigatePrevious={state.rowEditor.goToPreviousRow}
              onNavigateNext={state.rowEditor.goToNextRow}
            >
              {state.rowEditor.mode === "insert" ? (
                <InsertRowForm
                  key={`${tableName}:insert`}
                  rowValues={state.rowValues ?? {}}
                  schemaColumns={state.schemaColumns}
                  onCancel={() => {
                    state.handleRowEditorOpenChange(false);
                  }}
                  onSave={state.handleInsertSave}
                />
              ) : (
                <EditRowForm
                  key={`${tableName}:${state.rowEditor.activeRowId ?? "none"}`}
                  rowValues={state.rowValues}
                  schemaColumns={state.schemaColumns}
                  targetRowId={state.rowEditor.activeRowId}
                  focusedFieldName={state.activeCell?.columnId ?? null}
                  onCancel={() => {
                    state.handleRowEditorOpenChange(false);
                  }}
                  onDelete={state.handleDelete}
                  onSave={state.handleEditSave}
                />
              )}
            </RowEditorSidePanel>
          </ResizablePanel>
        </>
      ) : null}
    </ResizablePanelGroup>
  );
}
