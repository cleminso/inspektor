import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDataViewState } from "@/components/table-explorer/data/useDataViewState";

const openEdit = vi.fn();
const closeEditor = vi.fn();
const setRowEditor = vi.fn();
const searchState = {
  editorMode: null as "edit" | "insert" | null,
  filters: [],
  rowId: null as string | null,
  setFilters: vi.fn(),
  setRowEditor,
  setSorting: vi.fn(),
  sortColumn: "id",
  sortDirection: "asc" as const,
};

vi.mock("jazz-tools/react", () => ({
  useAll: () => [],
}));

vi.mock("@/components/providers/inspectorProvider", () => ({
  useInspector: () => ({
    currentBranch: "main",
    currentConnectionId: "connection-1",
    currentSchemaHash: "schema-1",
    runtime: { wasmSchema: null },
  }),
}));

vi.mock("@/hooks/useInspectorColumnVisibility", () => ({
  useInspectorColumnVisibility: () => ({
    columnVisibility: { id: true },
    setColumnVisibility: vi.fn(),
  }),
}));

vi.mock("@/hooks/useInspectorColumnOrder", () => ({
  useInspectorColumnOrder: () => ({
    columnOrder: ["id"],
    setColumnOrder: vi.fn(),
  }),
}));

vi.mock("@/hooks/useInspectorRowEditor", () => ({
  useInspectorRowEditor: () => ({
    close: closeEditor,
    editedRowIds: [],
    openEdit,
    openInsert: vi.fn(),
    setActiveRowIndex: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTableExplorerSearchParams", () => ({
  useTableExplorerSearchParams: () => searchState,
}));

vi.mock("@/hooks/useTableMutations", () => ({
  useTableMutations: () => ({
    deleteRow: vi.fn(),
    insertRow: vi.fn(),
    updateRow: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTableQuery", () => ({
  useTableQuery: () => ({
    columns: [
      {
        accessorKey: "id",
        column: null,
        id: "id",
        isSortable: true,
        label: "id",
      },
    ],
    fetchMore: vi.fn(),
    hasMore: false,
    isFetchingMore: false,
    loadedRowCount: 1,
    resetLoadedRows: vi.fn(),
    rows: [{ id: "row-1" }, { id: "row-2" }],
  }),
}));

beforeEach(() => {
  openEdit.mockClear();
  closeEditor.mockClear();
  setRowEditor.mockClear();
  searchState.editorMode = null;
  searchState.rowId = null;
});

describe("useDataViewState", () => {
  it("opens the complete-row pane when a row is checked", () => {
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    act(() => {
      result.current.table.getRow("row-1").toggleSelected(true);
    });

    expect(openEdit).toHaveBeenCalledWith(["row-1"], 0);
    expect(setRowEditor).toHaveBeenCalledWith("edit", "row-1", { replace: false });
  });

  it("clears active cell focus and closes the pane on Escape", () => {
    searchState.editorMode = "edit";
    searchState.rowId = "row-1";
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));
    const focusedCell = document.createElement("td");
    focusedCell.dataset.slot = "data-table-cell";
    focusedCell.tabIndex = -1;
    document.body.append(focusedCell);
    focusedCell.focus();

    act(() => {
      result.current.handleCellActivate({ columnId: "id", rowId: "row-1" });
    });
    expect(result.current.activeCell).toEqual({ columnId: "id", rowId: "row-1" });

    act(() => {
      result.current.handleEscape();
    });

    expect(result.current.activeCell).toBeNull();
    expect(document.activeElement).not.toBe(focusedCell);
    expect(closeEditor).toHaveBeenCalledOnce();
    expect(setRowEditor).toHaveBeenLastCalledWith(null, null, { replace: false });
    focusedCell.remove();
  });

  it("derives the active cell row from the active editor row", () => {
    searchState.editorMode = "edit";
    searchState.rowId = "row-1";
    const { result, rerender } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    act(() => {
      result.current.handleCellActivate({ columnId: "id", rowId: "row-1" });
    });

    searchState.rowId = "row-2";
    rerender();

    expect(result.current.activeCell).toEqual({ columnId: "id", rowId: "row-2" });
  });
});
