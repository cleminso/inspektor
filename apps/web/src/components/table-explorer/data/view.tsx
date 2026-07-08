import { useState } from "react";

import { Button } from "@regarde/ui/button";
import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@regarde/ui/resizablePanel";

import { ActionsBar } from "@/components/table-explorer/actionsBar";
import { DataGrid } from "@/components/table-explorer/data/dataGrid";
import { DataGridToolbar } from "@/components/table-explorer/data/dataGridToolbar";
import { EditRowForm } from "@/components/table-explorer/data/editRowForm";
import { InsertRowForm } from "@/components/table-explorer/data/insertRowForm";
import { RowEditorSidePanel } from "@/components/table-explorer/data/rowEditorSidePanel";
import { TableFilter } from "@/components/table-explorer/data/tableFilter";
import { useDataViewState } from "@/components/table-explorer/data/useDataViewState";
import type { TableExplorerView } from "@/types/tableExplorer";

interface DataViewProps {
  isListPaneOpen: boolean;
  onToggleListPane: () => void;
  onViewChange: (view: TableExplorerView) => Promise<void>;
  tableName: string;
  view: TableExplorerView;
}

export function DataView({
  isListPaneOpen,
  onToggleListPane,
  onViewChange,
  tableName,
  view,
}: DataViewProps): React.ReactElement {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const state = useDataViewState({
    tableName,
  });

  return (
    <ResizableGroup orientation="horizontal" className="min-w-0 bg-background">
      <ResizablePanel className="min-w-0 overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden">
          <ActionsBar
            view={view}
            isListPaneOpen={isListPaneOpen}
            isFilterOpen={isFilterOpen}
            filterCount={state.filters.length}
            onToggleListPane={onToggleListPane}
            onFilterOpenChange={setIsFilterOpen}
            onViewChange={onViewChange}
          >
            <ActionsBar.Leading>
              <Button
                type="button"
                variant="default"
                size="default"
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
          <ResizableSeparator />
          <ResizablePanel className="min-w-0 overflow-hidden" defaultSize={420} minSize={320} maxSize={720}>
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
    </ResizableGroup>
  );
}
