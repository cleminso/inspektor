import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createColumnHelper,
  getCoreRowModel,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { memo, useState, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "./dataTable";
import { useDataTableContext } from "./dataTableContext";

let onDataTableDragEnd: ((event: unknown) => void) | undefined;
let onDataTableDragOver: ((event: unknown) => void) | undefined;
let onDataTableDragStart: ((event: unknown) => void) | undefined;
let dragOverlayDropAnimation: unknown;
let dragOverlaySource: { element?: Element | null; id: string } = { id: "name" };
const sortableInputs: unknown[] = [];
const sortableTargetRefs = new Map<string, ReturnType<typeof vi.fn>>();
let droppingSortableId: string | null = null;

vi.mock("@dnd-kit/react", () => ({
  DragOverlay: ({
    children,
    dropAnimation,
  }: {
    children?: (source: { element?: Element | null; id: string }) => ReactNode;
    dropAnimation?: unknown;
  }) => {
    dragOverlayDropAnimation = dropAnimation;
    return <div data-testid="column-drag-overlay">{children?.(dragOverlaySource)}</div>;
  },
  DragDropProvider: ({
    children,
    onDragEnd,
    onDragOver,
    onDragStart,
  }: {
    children: ReactNode;
    onDragEnd?: (event: unknown) => void;
    onDragOver?: (event: unknown) => void;
    onDragStart?: (event: unknown) => void;
  }) => {
    onDataTableDragEnd = onDragEnd;
    onDataTableDragOver = onDragOver;
    onDataTableDragStart = onDragStart;
    return children;
  },
}));

vi.mock("@dnd-kit/react/sortable", () => ({
  isSortable: (source: { sortable?: boolean } | null | undefined) => source?.sortable === true,
  useSortable: (input: { id: string }) => {
    const targetRef = vi.fn();
    sortableInputs.push(input);
    sortableTargetRefs.set(input.id, targetRef);
    return {
      isDropping: input.id === droppingSortableId,
      isDragSource: false,
      ref: () => undefined,
      targetRef,
    };
  },
}));

vi.mock("@dnd-kit/abstract/modifiers", () => ({
  RestrictToHorizontalAxis: class RestrictToHorizontalAxis {},
}));

vi.mock("@dnd-kit/dom", () => ({
  AutoScroller: { configure: () => ({}) },
  Feedback: { configure: () => ({}) },
  PointerActivationConstraints: {
    Distance: class Distance {
      constructor(_options: { value: number }) {}
    },
  },
  PointerSensor: { configure: () => ({}) },
}));

vi.mock("@dnd-kit/dom/modifiers", () => ({
  RestrictToElement: { configure: () => ({}) },
}));

interface Person {
  id: string;
  name: string;
  role: string;
}

const columnHelper = createColumnHelper<Person>();
const columns = [
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("role", { header: "Role" }),
];
const rows: Person[] = [
  { id: "person-1", name: "Ada", role: "Engineer" },
  { id: "person-2", name: "Grace", role: "Admiral" },
];

const contextRenderCount = { current: 0 };

const ContextRenderProbe = memo(function ContextRenderProbe() {
  useDataTableContext<Person>();
  contextRenderCount.current += 1;
  return null;
});

function StableContextDataTable() {
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [, setRenderCount] = useState(0);
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <>
      <button type="button" onClick={() => setRenderCount((count) => count + 1)}>
        Rerender
      </button>
      <button type="button" onClick={() => setActiveColumnId("name")}>
        Activate column
      </button>
      <DataTable.Root table={table} activeColumnId={activeColumnId}>
        <ContextRenderProbe />
      </DataTable.Root>
    </>
  );
}

interface TestDataTableProps {
  activeCell?: { columnId: string; rowId: string } | null;
  activeColumnId?: string | null;
  activeRowId?: string | null;
  data?: Person[];
  loading?: boolean;
  onCellActivate?: (target: { columnId: string; rowId: string }) => void;
  onCellContextMenu?: (target: { columnId: string; rowId: string }) => void;
  onColumnActivate?: (columnId: string | null) => void;
  onRowActivate?: (rowId: string) => void;
  selectedCells?: { columnId: string; rowId: string }[];
  selectedRowIds?: string[];
}

function TestDataTable({
  activeCell = null,
  activeColumnId = null,
  activeRowId = null,
  data = rows,
  loading = false,
  onCellActivate,
  onCellContextMenu,
  onColumnActivate,
  onRowActivate,
  selectedCells = [],
  selectedRowIds = [],
}: TestDataTableProps) {
  const rowSelection = Object.fromEntries(selectedRowIds.map((rowId) => [rowId, true]));
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    state: { rowSelection },
  });

  return (
    <DataTable.Root
      table={table}
      activeCell={activeCell}
      activeColumnId={activeColumnId}
      activeRowId={activeRowId}
      onCellActivate={onCellActivate}
      onCellContextMenu={(target) => onCellContextMenu?.(target)}
      onColumnActivate={onColumnActivate}
      onRowActivate={onRowActivate}
      selectedCells={selectedCells}
    >
      <DataTable.Viewport>
        <DataTable.Table aria-label="People">
          <DataTable.Content
            loading={loading}
            emptyContent="No people"
            loadingContent="Loading people"
          />
        </DataTable.Table>
      </DataTable.Viewport>
    </DataTable.Root>
  );
}

function ExpandedTestDataTable() {
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });
  const firstRow = table.getRowModel().rows[0];

  return (
    <DataTable.Root table={table}>
      <DataTable.Viewport>
        <DataTable.Table aria-label="Expanded people">
          <DataTable.Header />
          <DataTable.Body>
            {firstRow === undefined ? null : (
              <>
                <DataTable.Row row={firstRow} />
                <DataTable.ExpandedRow row={firstRow}>Ada details</DataTable.ExpandedRow>
              </>
            )}
          </DataTable.Body>
        </DataTable.Table>
      </DataTable.Viewport>
    </DataTable.Root>
  );
}

function InteractiveHeaderDataTable({
  onColumnActivate,
}: {
  onColumnActivate: (columnId: string | null) => void;
}) {
  const interactiveColumns = [
    columnHelper.accessor("name", {
      header: () => <button type="button">Sort name</button>,
    }),
  ];
  const table = useReactTable({
    columns: interactiveColumns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <DataTable.Root table={table} onColumnActivate={onColumnActivate}>
      <DataTable.Viewport>
        <DataTable.Table aria-label="Sortable people">
          <DataTable.Content />
        </DataTable.Table>
      </DataTable.Viewport>
    </DataTable.Root>
  );
}

function KeyboardSortableDataTable({ onSortingChange }: { onSortingChange: () => void }) {
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    onSortingChange,
  });

  return (
    <DataTable.Root table={table}>
      <DataTable.Viewport>
        <DataTable.Table aria-label="Sortable people">
          <DataTable.Content />
        </DataTable.Table>
      </DataTable.Viewport>
    </DataTable.Root>
  );
}

function DismissibleColumnDataTable() {
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <DataTable.Root
      table={table}
      activeColumnId={activeColumnId}
      onColumnActivate={setActiveColumnId}
    >
      <DataTable.Viewport>
        <DataTable.Table aria-label="Dismissible columns">
          <DataTable.Content />
        </DataTable.Table>
      </DataTable.Viewport>
    </DataTable.Root>
  );
}

function SelectionHitAreaDataTable({ onCellActivate }: {
  onCellActivate: (target: { columnId: string; rowId: string }) => void;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectionColumns = [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <input
          aria-label="Select all rows"
          checked={table.getIsAllRowsSelected()}
          onChange={(event) => {
            table.toggleAllRowsSelected(event.currentTarget.checked);
          }}
          type="checkbox"
        />
      ),
      cell: ({ row }) => (
        <input
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onChange={(event) => {
            row.toggleSelected(event.currentTarget.checked);
          }}
          type="checkbox"
        />
      ),
    }),
    ...columns,
  ];
  const table = useReactTable({
    columns: selectionColumns,
    data: rows,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  return (
    <DataTable.Root table={table} onCellActivate={onCellActivate}>
      <DataTable.Viewport>
        <DataTable.Table aria-label="Selectable people">
          <DataTable.Content />
        </DataTable.Table>
      </DataTable.Viewport>
    </DataTable.Root>
  );
}

function ReorderableDataTable({
  columnDragPreview,
  initialColumnOrder = ["name", "role"],
  onColumnOrderChange,
}: {
  columnDragPreview?: (columnId: string) => ReactNode;
  initialColumnOrder?: string[];
  onColumnOrderChange: (columnIds: string[]) => void;
}) {
  const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    state: { columnOrder },
  });

  return (
    <DataTable.Root
      table={table}
      columnDragPreview={columnDragPreview}
      columnOrder={columnOrder}
      onColumnOrderChange={(nextColumnOrder) => {
        setColumnOrder(nextColumnOrder);
        onColumnOrderChange(nextColumnOrder);
      }}
    >
      <DataTable.Viewport>
        <DataTable.Table aria-label="Reorderable people">
          <DataTable.Content />
        </DataTable.Table>
      </DataTable.Viewport>
    </DataTable.Root>
  );
}

afterEach(() => {
  cleanup();
  contextRenderCount.current = 0;
  dragOverlayDropAnimation = undefined;
  dragOverlaySource = { id: "name" };
  droppingSortableId = null;
  onDataTableDragEnd = undefined;
  onDataTableDragOver = undefined;
  onDataTableDragStart = undefined;
  sortableInputs.length = 0;
  sortableTargetRefs.clear();
});

describe("DataTable", () => {
  it("rejects duplicate reorder column ids", () => {
    expect(() =>
      render(
        <ReorderableDataTable
          initialColumnOrder={["name", "name"]}
          onColumnOrderChange={() => undefined}
        />,
      ),
    ).toThrow("DataTable columnOrder values must be unique");
  });

  it("preserves the focused header when reorder behavior loads", async () => {
    render(<ReorderableDataTable onColumnOrderChange={() => undefined} />);
    const header = screen.getByRole("columnheader", { name: "Name" });
    header.focus();
    expect(header.hasAttribute("data-reorderable")).toBe(false);

    await waitFor(() => {
      expect(onDataTableDragStart).toBeTypeOf("function");
    });

    const reorderedHeader = screen.getByRole("columnheader", { name: "Name" });
    expect(document.activeElement).toBe(reorderedHeader);
    expect(reorderedHeader.hasAttribute("data-reorderable")).toBe(true);
  });

  it("preserves context identity until a meaningful input changes", () => {
    render(<StableContextDataTable />);

    expect(contextRenderCount.current).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Rerender" }));

    expect(contextRenderCount.current).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Activate column" }));

    expect(contextRenderCount.current).toBe(2);
  });

  it("renders semantic headers, rows, and visible cells from TanStack state", () => {
    render(<TestDataTable />);

    expect(screen.getByRole("table", { name: "People" })).toBeTruthy();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("cell", { name: "Ada" })).toBeTruthy();
  });

  it("renders explicit loading and empty content", () => {
    const { rerender } = render(<TestDataTable loading />);

    expect(screen.getByText("Loading people")).toBeTruthy();

    rerender(<TestDataTable data={[]} />);

    expect(screen.getByText("No people")).toBeTruthy();
  });

  it("gives active-cell state precedence over column highlighting", () => {
    render(
      <TestDataTable
        activeRowId="person-1"
        activeColumnId="role"
        activeCell={{ rowId: "person-1", columnId: "role" }}
        selectedRowIds={["person-2"]}
      />,
    );

    const adaRow = screen.getByRole("row", { name: /Ada Engineer/ });
    const graceRow = screen.getByRole("row", { name: /Grace Admiral/ });
    const activeCell = screen.getByRole("cell", { name: "Engineer" });
    const activeHeader = screen.getByRole("columnheader", { name: "Role" });

    expect(adaRow.hasAttribute("data-active")).toBe(true);
    expect(graceRow.hasAttribute("data-selected")).toBe(true);
    expect(activeHeader.hasAttribute("data-active")).toBe(false);
    expect(activeCell.hasAttribute("data-active")).toBe(true);
    expect(activeCell.hasAttribute("data-column-active")).toBe(false);
    expect(activeCell.hasAttribute("data-row-active")).toBe(true);
    expect(graceRow.querySelectorAll("[data-selected]")).toHaveLength(2);
  });

  it("highlights a column when no cell is active", () => {
    render(<TestDataTable activeColumnId="role" />);

    const activeHeader = screen.getByRole("columnheader", { name: "Role" });
    const activeColumnCell = screen.getByRole("cell", { name: "Engineer" });

    expect(activeHeader.hasAttribute("data-active")).toBe(true);
    expect(activeColumnCell.hasAttribute("data-column-active")).toBe(true);
  });

  it("reports header, row, cell, and cell context-menu activation targets", () => {
    const onColumnActivate = vi.fn();
    const onRowActivate = vi.fn();
    const onCellActivate = vi.fn();
    const onCellContextMenu = vi.fn();

    render(
      <TestDataTable
        onColumnActivate={onColumnActivate}
        onRowActivate={onRowActivate}
        onCellActivate={onCellActivate}
        onCellContextMenu={onCellContextMenu}
      />,
    );

    fireEvent.click(screen.getByRole("columnheader", { name: "Role" }));
    fireEvent.click(screen.getByRole("row", { name: /Ada Engineer/ }));
    fireEvent.click(screen.getByRole("cell", { name: "Admiral" }));
    fireEvent.contextMenu(screen.getByRole("cell", { name: "Engineer" }));

    expect(onColumnActivate).toHaveBeenCalledWith("role");
    expect(onRowActivate).toHaveBeenCalledWith("person-1");
    expect(onCellActivate).toHaveBeenCalledWith({ rowId: "person-2", columnId: "role" }, "replace");
    expect(onCellContextMenu).toHaveBeenCalledWith({ rowId: "person-1", columnId: "role" });
  });

  it("activates a cell once across the click sequence of a double click", () => {
    const onCellActivate = vi.fn();
    render(<TestDataTable onCellActivate={onCellActivate} />);
    const cell = screen.getByRole("cell", { name: "Engineer" });

    fireEvent.click(cell, { detail: 1 });
    fireEvent.click(cell, { detail: 2 });
    fireEvent.doubleClick(cell);

    expect(onCellActivate).toHaveBeenCalledOnce();
  });

  it("reports additive and range cell-selection intent from click modifiers", () => {
    const onCellActivate = vi.fn();
    render(<TestDataTable onCellActivate={onCellActivate} />);
    const cell = screen.getByRole("cell", { name: "Engineer" });

    fireEvent.click(cell, { metaKey: true });
    fireEvent.click(cell, { shiftKey: true });

    expect(onCellActivate).toHaveBeenNthCalledWith(
      1,
      { rowId: "person-1", columnId: "role" },
      "additive",
    );
    expect(onCellActivate).toHaveBeenNthCalledWith(
      2,
      { rowId: "person-1", columnId: "role" },
      "range",
    );
  });

  it("marks every selected cell independently from checked rows", () => {
    render(
      <TestDataTable
        selectedCells={[
          { rowId: "person-1", columnId: "name" },
          { rowId: "person-2", columnId: "role" },
        ]}
      />,
    );

    expect(screen.getByRole("cell", { name: "Ada" }).hasAttribute("data-cell-selected")).toBe(true);
    expect(screen.getByRole("cell", { name: "Admiral" }).hasAttribute("data-cell-selected")).toBe(
      true,
    );
    expect(screen.getByRole("cell", { name: "Engineer" }).hasAttribute("data-cell-selected")).toBe(
      false,
    );
  });

  it("registers body cells only as column drop targets", async () => {
    render(<ReorderableDataTable onColumnOrderChange={vi.fn()} />);
    const cell = screen.getByRole("cell", { name: "Engineer" });

    await waitFor(() => {
      expect(sortableTargetRefs.get("person-1:role")).toHaveBeenCalledWith(cell);
    });
  });

  it("supports expanded content through manual compound composition", () => {
    render(<ExpandedTestDataTable />);

    const details = screen.getByRole("cell", { name: "Ada details" });
    expect(details.getAttribute("colspan")).toBe("2");
  });

  it("activates a column when its interactive header content is used", () => {
    const onColumnActivate = vi.fn();
    render(<InteractiveHeaderDataTable onColumnActivate={onColumnActivate} />);

    fireEvent.click(screen.getByRole("button", { name: "Sort name" }));

    expect(onColumnActivate).toHaveBeenCalledWith("name");
  });

  it("deactivates a column when its active header is clicked again", () => {
    render(<DismissibleColumnDataTable />);
    const header = screen.getByRole("columnheader", { name: "Role" });

    fireEvent.click(header);
    expect(header.hasAttribute("data-active")).toBe(true);

    fireEvent.click(header);
    expect(header.hasAttribute("data-active")).toBe(false);
  });

  it("deactivates a column when a pointer press occurs outside the table", () => {
    render(<DismissibleColumnDataTable />);
    const header = screen.getByRole("columnheader", { name: "Role" });

    fireEvent.click(header);
    fireEvent.pointerDown(document.body);

    expect(header.hasAttribute("data-active")).toBe(false);
  });

  it("uses the complete checkbox cell as the selection hit area", () => {
    const onCellActivate = vi.fn();
    render(<SelectionHitAreaDataTable onCellActivate={onCellActivate} />);
    const checkbox = screen.getByRole("checkbox", { name: "Select Ada" });
    const checkboxCell = checkbox.closest("td");

    expect(checkboxCell).not.toBeNull();
    fireEvent.click(checkboxCell as HTMLTableCellElement);

    expect((checkbox as HTMLInputElement).checked).toBe(true);
    expect(document.activeElement).not.toBe(checkboxCell);
    expect(onCellActivate).not.toHaveBeenCalled();
  });

  it("moves headers and body cells together while a column is dragged", async () => {
    const onColumnOrderChange = vi.fn();
    render(<ReorderableDataTable onColumnOrderChange={onColumnOrderChange} />);

    await waitFor(() => {
      expect(onDataTableDragOver).toBeTypeOf("function");
    });

    act(() => {
      onDataTableDragStart?.({ operation: {} });
      onDataTableDragOver?.({
        operation: {
          source: {
            id: "role",
            initialIndex: 1,
            index: 1,
            sortable: true,
            type: "column",
          },
          target: {
            id: "name",
            index: 0,
            sortable: true,
            type: "column",
          },
        },
        preventDefault: () => undefined,
      });
    });

    expect(onColumnOrderChange).toHaveBeenCalledWith(["role", "name"]);
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Role",
      "Name",
    ]);
    expect(
      screen
        .getAllByRole("cell")
        .slice(0, 2)
        .map((cell) => cell.textContent),
    ).toEqual(["Engineer", "Ada"]);
  });

  it("moves a focused header with Shift and horizontal arrow keys", async () => {
    const onColumnOrderChange = vi.fn();
    render(<ReorderableDataTable onColumnOrderChange={onColumnOrderChange} />);

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: "Name" }).hasAttribute("data-reorderable")).toBe(
        true,
      );
    });

    const header = screen.getByRole("columnheader", { name: "Name" });
    header.focus();
    fireEvent.keyDown(header, { key: "ArrowRight", shiftKey: true });

    expect(onColumnOrderChange).toHaveBeenCalledWith(["role", "name"]);
    expect(document.activeElement).toBe(screen.getByRole("columnheader", { name: "Name" }));
  });

  it("renders an application-provided drag preview", async () => {
    render(
      <ReorderableDataTable
        columnDragPreview={(columnId) => <span>{`Marker ${columnId}`}</span>}
        onColumnOrderChange={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("column-drag-overlay").textContent).toBe("Marker name");
    });
  });

  it("gives reorderable body cells row-scoped sortable transitions without making them draggable", async () => {
    render(<ReorderableDataTable onColumnOrderChange={() => undefined} />);

    await waitFor(() => {
      expect(sortableInputs).toContainEqual({
        accept: "column-cell",
        id: "person-1:role",
        index: 1,
        group: "data-table-row:person-1",
        disabled: {
          draggable: true,
          droppable: false,
        },
        type: "column-cell",
      });
    });
  });

  it("keeps the source header slot reserved without duplicating the overlay content", async () => {
    droppingSortableId = "name";
    render(<ReorderableDataTable onColumnOrderChange={() => undefined} />);

    await waitFor(() => {
      const header = document.querySelector<HTMLElement>('[data-column-id="name"]');
      expect(header).not.toBeNull();
      const source = header?.querySelector<HTMLElement>(
        '[data-slot="data-table-header-drag-source"]',
      );
      expect(header?.hasAttribute("data-dragging")).toBe(true);
      expect(source).not.toBeNull();
      expect(source?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  it("reports sort state and toggles sorting from a focused header with Enter", () => {
    const onSortingChange = vi.fn();
    render(<KeyboardSortableDataTable onSortingChange={onSortingChange} />);

    const header = screen.getByRole("columnheader", { name: "Name" });
    expect(header.getAttribute("aria-sort")).toBe("none");
    header.focus();
    fireEvent.keyDown(header, { key: "Enter" });

    expect(onSortingChange).toHaveBeenCalledOnce();
  });

  it("does not animate the drag overlay after the pointer is released", async () => {
    render(<ReorderableDataTable onColumnOrderChange={() => undefined} />);

    await waitFor(() => {
      expect(dragOverlayDropAnimation).toBeNull();
    });
  });

  it("restores the complete column order when a drag is canceled", async () => {
    const onColumnOrderChange = vi.fn();
    render(<ReorderableDataTable onColumnOrderChange={onColumnOrderChange} />);

    await waitFor(() => {
      expect(onDataTableDragOver).toBeTypeOf("function");
    });

    act(() => {
      onDataTableDragStart?.({ operation: {} });
      onDataTableDragOver?.({
        operation: {
          source: {
            id: "role",
            initialIndex: 1,
            index: 1,
            sortable: true,
            type: "column",
          },
          target: {
            id: "name",
            index: 0,
            sortable: true,
            type: "column",
          },
        },
        preventDefault: () => undefined,
      });
    });
    act(() => {
      onDataTableDragEnd?.({ canceled: true, operation: {} });
    });

    expect(onColumnOrderChange).toHaveBeenLastCalledWith(["name", "role"]);
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Name",
      "Role",
    ]);
    expect(
      screen
        .getAllByRole("cell")
        .slice(0, 2)
        .map((cell) => cell.textContent),
    ).toEqual(["Ada", "Engineer"]);
  });
});
