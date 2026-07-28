import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useReducer } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "@inspector/ds";

import {
  createInsertRowValues,
  useDataViewState,
} from "@/components/table-explorer/data/useDataViewState";

const setRowEditor = vi.fn();
const deleteRow = vi.fn();
const insertRow = vi.fn();
const updateRow = vi.fn();
const columnOrderState = {
  columnOrder: ["id", "name"],
  setColumnOrder: vi.fn((columnIds: string[]) => {
    columnOrderState.columnOrder = columnIds;
  }),
};
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
let activeRows: Array<Record<string, unknown>> = [];
const routeBlocker = {
  action: undefined,
  current: undefined,
  next: undefined,
  proceed: undefined,
  reset: undefined,
  status: "idle" as const,
};
let shouldBlockNavigation = () => false;

vi.mock("@tanstack/react-router", () => ({
  useBlocker: (options: { shouldBlockFn: () => boolean }) => {
    shouldBlockNavigation = options.shouldBlockFn;
    return routeBlocker;
  },
}));

vi.mock("jazz-tools/react", () => ({
  useAll: () => activeRows,
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
  useInspectorColumnOrder: () => columnOrderState,
}));

vi.mock("@/hooks/useTableExplorerSearchParams", () => ({
  useTableExplorerSearchParams: () => searchState,
}));

vi.mock("@/hooks/useTableMutations", () => ({
  useTableMutations: () => ({
    deleteRow,
    insertRow,
    updateRow,
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
      {
        accessorKey: "name",
        column: null,
        id: "name",
        isSortable: true,
        label: "Name",
      },
    ],
    fetchMore: vi.fn(),
    hasMore: false,
    isFetchingMore: false,
    loadedRowCount: 1,
    resetLoadedRows: vi.fn(),
    rows: [
      { id: "row-1", name: "Ada" },
      { id: "row-2", name: "Grace" },
    ],
  }),
}));

beforeEach(() => {
  setRowEditor.mockClear();
  deleteRow.mockReset();
  insertRow.mockReset();
  updateRow.mockReset();
  setRowEditor.mockImplementation((mode: "edit" | "insert" | null, rowId: string | null) => {
    searchState.editorMode = mode;
    searchState.rowId = rowId;
  });
  searchState.editorMode = null;
  searchState.rowId = null;
  searchState.sortColumn = "id";
  columnOrderState.columnOrder = ["id", "name"];
  activeRows = [];
  Object.assign(routeBlocker, {
    action: undefined,
    current: undefined,
    next: undefined,
    proceed: undefined,
    reset: undefined,
    status: "idle",
  });
});

afterEach(cleanup);

function DataViewInteractionHarness(): React.ReactElement {
  const state = useDataViewState({ tableName: "accounts" });
  const [, forceRender] = useReducer((value: number) => value + 1, 0);

  return (
    <>
      <output aria-label="Pane mode">{state.detailPaneMode}</output>
      <output aria-label="Selected row count">
        {state.table.getSelectedRowModel().rows.length}
      </output>
      <button
        type="button"
        onClick={() => {
          state.handleEscape();
          forceRender();
        }}
      >
        Dismiss pane
      </button>
      <DataTable.Root
        table={state.table}
        columnOrder={state.columnOrder}
        activeCell={state.activeCell}
        activeColumnId={state.activeColumnId}
        activeRowId={state.rowEditor.activeRowId}
        selectedCells={state.selectedCells}
        onCellActivate={state.handleCellActivate}
        onColumnActivate={state.handleColumnActivate}
        onColumnOrderChange={state.setColumnOrder}
      >
        <DataTable.Viewport>
          <DataTable.Table aria-label="Accounts">
            <DataTable.Content />
          </DataTable.Table>
        </DataTable.Viewport>
      </DataTable.Root>
    </>
  );
}

describe("useDataViewState", () => {
  it("leaves a default-backed binary insert field undefined so Jazz can apply its default", () => {
    expect(
      createInsertRowValues([
        {
          name: "payload",
          column_type: { type: "Bytea" },
          nullable: false,
          default: { type: "Bytea", value: new Uint8Array([1, 2]) },
        },
      ]),
    ).toEqual({ payload: undefined });
  });

  it("does not invent a value for a required read-only binary insert field", () => {
    expect(
      createInsertRowValues([
        {
          name: "payload",
          column_type: { type: "Bytea" },
          nullable: false,
        },
      ]),
    ).toEqual({ payload: undefined });
  });

  it("ignores an active-row query result whose identity does not match the requested row", () => {
    searchState.editorMode = "edit";
    searchState.rowId = "row-3";
    activeRows = [{ id: "row-previous", name: "Previous" }];

    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    expect(result.current.rowValues).toBeNull();
  });

  it("keeps the side pane closed when a focused cell is double-clicked", () => {
    render(<DataViewInteractionHarness />);
    const cell = screen.getByRole("cell", { name: "Ada" });

    fireEvent.click(cell);

    expect(cell.hasAttribute("data-active")).toBe(true);
    expect(screen.getByRole("status", { name: "Pane mode" }).textContent).toBe("closed");

    fireEvent.doubleClick(cell);

    expect(screen.getByRole("status", { name: "Pane mode" }).textContent).toBe("closed");
  });

  it("moves focus from a selected cell to a clicked column header", () => {
    render(<DataViewInteractionHarness />);
    const cell = screen.getByRole("cell", { name: "Ada" });
    const header = screen.getByRole("columnheader", { name: "Name" });

    fireEvent.click(cell);
    fireEvent.click(header);

    expect(cell.hasAttribute("data-active")).toBe(false);
    expect(header.hasAttribute("data-active")).toBe(true);
    expect(screen.getByRole("status", { name: "Pane mode" }).textContent).toBe("closed");
  });

  it("opens the complete-row pane when a row is checked", () => {
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    act(() => {
      result.current.table.getRow("row-1").toggleSelected(true);
    });

    expect(result.current.table.getRow("row-1").getIsSelected()).toBe(true);
    expect(setRowEditor).toHaveBeenCalledWith("edit", "row-1", { replace: false });
  });

  it("allows an individual row to be unchecked after its pane is closed", () => {
    const { result, rerender } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    act(() => {
      result.current.table.getRow("row-1").toggleSelected(true);
    });
    act(() => {
      result.current.handleRowEditorOpenChange(false);
    });
    rerender();
    act(() => {
      result.current.table.getRow("row-1").toggleSelected(false);
    });

    expect(result.current.table.getRow("row-1").getIsSelected()).toBe(false);
    expect(result.current.rowEditor.editedRowIds).toEqual([]);
  });

  it("cancels the focused row by unchecking it and focusing the nearest checked row", () => {
    const { result, rerender } = renderHook(() => useDataViewState({ tableName: "accounts" }));
    act(() => {
      result.current.table.getRow("row-1").toggleSelected(true);
    });
    rerender();
    act(() => {
      result.current.table.getRow("row-2").toggleSelected(true);
    });
    rerender();

    act(() => {
      result.current.handleRowEditorCancel();
    });
    rerender();

    expect(result.current.table.getRow("row-2").getIsSelected()).toBe(false);
    expect(result.current.table.getRow("row-1").getIsSelected()).toBe(true);
    expect(setRowEditor).toHaveBeenLastCalledWith("edit", "row-1", { replace: false });
  });

  it("closes the row pane when cancelling its only checked row", () => {
    const { result, rerender } = renderHook(() => useDataViewState({ tableName: "accounts" }));
    act(() => {
      result.current.table.getRow("row-1").toggleSelected(true);
    });
    rerender();

    act(() => {
      result.current.handleRowEditorCancel();
    });
    rerender();

    expect(result.current.table.getRow("row-1").getIsSelected()).toBe(false);
    expect(setRowEditor).toHaveBeenLastCalledWith(null, null, { replace: false });
  });

  it("requires an explicit decision before dismissing a dirty row draft", () => {
    searchState.editorMode = "edit";
    searchState.rowId = "row-1";
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));
    act(() => {
      result.current.handleRowDraftDirtyChange(true);
    });
    setRowEditor.mockClear();

    act(() => {
      result.current.handleRowEditorOpenChange(false);
    });

    expect(result.current.draftTransition.isPending).toBe(true);
    expect(setRowEditor).not.toHaveBeenCalled();
    setRowEditor.mockImplementation(() => {
      if (shouldBlockNavigation() === true) {
        Object.assign(routeBlocker, { status: "blocked" });
      }
    });

    act(() => {
      result.current.draftTransition.discardAndContinue();
    });

    expect(result.current.draftTransition.isPending).toBe(false);
    expect(setRowEditor).toHaveBeenCalledWith(null, null, { replace: false });
    expect(routeBlocker.status).toBe("idle");
  });

  it("keeps the active dirty row when a requested transition is cancelled", () => {
    searchState.editorMode = "edit";
    searchState.rowId = "row-1";
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));
    act(() => {
      result.current.handleRowDraftDirtyChange(true);
    });
    act(() => {
      result.current.handleRowEditorOpenChange(false);
    });

    act(() => {
      result.current.draftTransition.keepEditing();
    });

    expect(result.current.draftTransition.isPending).toBe(false);
    expect(result.current.detailPaneMode).toBe("rows");
  });

  it("saves the dirty patch before completing a requested transition", async () => {
    searchState.editorMode = "edit";
    searchState.rowId = "row-1";
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));
    act(() => {
      result.current.handleRowDraftDirtyChange(true);
    });
    act(() => {
      result.current.handleRowEditorOpenChange(false);
    });

    await act(async () => {
      await result.current.handleEditSave({ name: "Grace" });
    });

    expect(updateRow).toHaveBeenCalledWith("row-1", { name: "Grace" });
    expect(result.current.draftTransition.isPending).toBe(false);
    expect(setRowEditor).toHaveBeenLastCalledWith(null, null, { replace: false });
  });

  it("continues a blocked route transition only after the dirty draft is discarded", () => {
    const proceed = vi.fn();
    const reset = vi.fn();
    searchState.editorMode = "edit";
    searchState.rowId = "row-1";
    const { result, rerender } = renderHook(() => useDataViewState({ tableName: "accounts" }));
    act(() => {
      result.current.handleRowDraftDirtyChange(true);
    });
    Object.assign(routeBlocker, {
      proceed,
      reset,
      status: "blocked",
    });
    rerender();

    expect(result.current.draftTransition.isPending).toBe(true);

    act(() => {
      result.current.draftTransition.discardAndContinue();
    });

    expect(proceed).toHaveBeenCalledOnce();
    expect(reset).not.toHaveBeenCalled();
  });

  it("unchecks a row through its own checkbox after pane dismissal", () => {
    render(<DataViewInteractionHarness />);
    const checkbox = screen.getByRole("checkbox", { name: "Select row row-1" });

    fireEvent.click(checkbox);
    expect(screen.getByRole("status", { name: "Selected row count" }).textContent).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Dismiss pane" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select row row-1" }));

    expect(screen.getByRole("status", { name: "Selected row count" }).textContent).toBe("0");
  });

  it("focuses a cell without opening or changing the pane", () => {
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    act(() => {
      result.current.handleCellActivate({ columnId: "id", rowId: "row-1" }, "replace");
    });

    expect(result.current.activeCell).toEqual({ columnId: "id", rowId: "row-1" });
    expect(result.current.detailPaneMode).toBe("closed");
    expect(setRowEditor).not.toHaveBeenCalled();
  });

  it("adds Command-clicked cells and selects a Shift range", () => {
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    act(() => {
      result.current.handleCellActivate({ columnId: "id", rowId: "row-1" }, "replace");
      result.current.handleCellActivate({ columnId: "name", rowId: "row-2" }, "additive");
    });

    expect(result.current.selectedCells).toEqual([
      { columnId: "id", rowId: "row-1" },
      { columnId: "name", rowId: "row-2" },
    ]);

    act(() => {
      result.current.handleCellActivate({ columnId: "name", rowId: "row-2" }, "range");
    });

    expect(result.current.selectedCells).toEqual([
      { columnId: "id", rowId: "row-1" },
      { columnId: "name", rowId: "row-1" },
      { columnId: "id", rowId: "row-2" },
      { columnId: "name", rowId: "row-2" },
    ]);
  });

  it("restores the checked row represented by URL-backed edit state", () => {
    searchState.editorMode = "edit";
    searchState.rowId = "row-2";

    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    expect(result.current.table.getRow("row-2").getIsSelected()).toBe(true);
    expect(result.current.detailPaneMode).toBe("rows");
  });

  it("keeps checkbox selection aligned with URL-backed row changes", () => {
    searchState.editorMode = "edit";
    searchState.rowId = "row-1";
    const { result, rerender } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    searchState.rowId = "row-2";
    rerender();

    expect(result.current.table.getRow("row-1").getIsSelected()).toBe(false);
    expect(result.current.table.getRow("row-2").getIsSelected()).toBe(true);
    expect(result.current.rowEditor.editedRowIds).toEqual(["row-2"]);
  });

  it("focuses the matching row-editor field when its cell is selected", async () => {
    searchState.editorMode = "edit";
    searchState.rowId = "row-1";
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));
    const field = document.createElement("div");
    const input = document.createElement("input");
    field.id = "row-editor-field-name";
    field.append(input);
    document.body.append(field);

    act(() => {
      result.current.handleCellActivate({ columnId: "name", rowId: "row-1" }, "replace");
    });
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(document.activeElement).toBe(input);
    field.remove();
  });

  it("opens the row pane without clearing cell focus", () => {
    const { result, rerender } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    act(() => {
      result.current.handleCellActivate({ columnId: "name", rowId: "row-2" }, "replace");
    });
    act(() => {
      result.current.table.getRow("row-1").toggleSelected(true);
    });
    rerender();

    expect(result.current.detailPaneMode).toBe("rows");
    expect(result.current.activeCell).toEqual({ columnId: "name", rowId: "row-2" });
    expect(result.current.rowEditor.activeRowId).toBe("row-1");
  });

  it("clears selections when filters change", async () => {
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    act(() => {
      result.current.handleCellActivate({ columnId: "name", rowId: "row-1" }, "replace");
    });
    await act(async () => {
      await result.current.setFilters([]);
    });

    expect(result.current.activeCell).toBeNull();
    expect(result.current.detailPaneMode).toBe("closed");
  });

  it("clears a focused cell when its column becomes hidden", () => {
    const { result } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    act(() => {
      result.current.handleCellActivate({ columnId: "name", rowId: "row-1" }, "replace");
    });
    act(() => {
      result.current.table.getColumn("name")?.toggleVisibility(false);
    });

    expect(result.current.activeCell).toBeNull();
  });

  it("clears selections when URL-backed query state changes externally", () => {
    const { result, rerender } = renderHook(() => useDataViewState({ tableName: "accounts" }));

    act(() => {
      result.current.handleCellActivate({ columnId: "name", rowId: "row-1" }, "replace");
    });
    searchState.sortColumn = "name";
    rerender();

    expect(result.current.activeCell).toBeNull();
    expect(result.current.detailPaneMode).toBe("closed");
  });

  it("clears selections when the table identity changes", () => {
    const { result, rerender } = renderHook(({ tableName }) => useDataViewState({ tableName }), {
      initialProps: { tableName: "accounts" },
    });

    act(() => {
      result.current.handleCellActivate({ columnId: "name", rowId: "row-1" }, "replace");
    });
    rerender({ tableName: "profiles" });

    expect(result.current.activeCell).toBeNull();
    expect(result.current.detailPaneMode).toBe("closed");
  });

});
