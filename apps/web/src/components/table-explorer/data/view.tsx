import { useState } from "react";

import { Button, ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@inspector/ds";

import { ActionsBar } from "@/components/table-explorer/actionsBar";
import { DataGrid } from "@/components/table-explorer/data/dataGrid";
import { DataGridToolbar } from "@/components/table-explorer/data/dataGridToolbar";
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
              <DataGridToolbar table={state.table} />
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
          <div className="min-h-0 flex-1 overflow-hidden">
            <DataGrid
              table={state.table}
              loadedRowCount={state.loadedRowCount}
              hasMore={state.hasMore}
              isFetchingMore={state.isFetchingMore}
              onFetchMore={state.fetchMore}
            />
          </div>
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
