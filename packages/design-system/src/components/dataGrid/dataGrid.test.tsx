import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createColumnHelper,
  getCoreRowModel,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { memo, useState, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataGrid } from "./dataGrid";
import { useDataGridContext } from "./dataGridContext";

let onDataGridDragEnd: ((event: unknown) => void) | undefined;
let onDataGridDragOver: ((event: unknown) => void) | undefined;
let onDataGridDragStart: ((event: unknown) => void) | undefined;
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
    onDataGridDragEnd = onDragEnd;
    onDataGridDragOver = onDragOver;
    onDataGridDragStart = onDragStart;
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
  useDataGridContext<Person>();
  contextRenderCount.current += 1;
  return null;
});

function StableContextDataGrid() {
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
      <DataGrid.Root table={table} activeColumnId={activeColumnId}>
        <ContextRenderProbe />
      </DataGrid.Root>
    </>
  );
}

interface TestDataGridProps {
  activeCell?: { columnId: string; rowId: string } | null;
  activeColumnId?: string | null;
  activeRowId?: string | null;
  data?: Person[];
  loading?: boolean;
  onCellActivate?: (target: { columnId: string; rowId: string }) => void;
  onCellContextMenu?: (target: { columnId: string; rowId: string }) => void;
  onColumnActivate?: (columnId: string | null) => void;
  onRowActivate?: (rowId: string) => void;
  resizingColumnId?: string | null;
  selectedCells?: { columnId: string; rowId: string }[];
  selectedRowIds?: string[];
}

function TestDataGrid({
  activeCell = null,
  activeColumnId = null,
  activeRowId = null,
  data = rows,
  loading = false,
  onCellActivate,
  onCellContextMenu,
  onColumnActivate,
  onRowActivate,
  resizingColumnId = null,
  selectedCells = [],
  selectedRowIds = [],
}: TestDataGridProps) {
  const rowSelection = Object.fromEntries(selectedRowIds.map((rowId) => [rowId, true]));
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    state: {
      columnSizingInfo: {
        columnSizingStart: [],
        deltaOffset: null,
        deltaPercentage: null,
        isResizingColumn: resizingColumnId ?? false,
        startOffset: null,
        startSize: null,
      },
      rowSelection,
    },
  });

  return (
    <DataGrid.Root
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
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="People">
          <DataGrid.Content
            loading={loading}
            emptyContent="No people"
            loadingContent="Loading people"
          />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  );
}

function ExpandedTestDataGrid() {
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });
  const firstRow = table.getRowModel().rows[0];

  return (
    <DataGrid.Root table={table}>
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Expanded people">
          <DataGrid.Header />
          <DataGrid.Body>
            {firstRow === undefined ? null : (
              <>
                <DataGrid.Row row={firstRow} />
                <DataGrid.ExpandedRow row={firstRow}>Ada details</DataGrid.ExpandedRow>
              </>
            )}
          </DataGrid.Body>
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  );
}

function InteractiveHeaderDataGrid({
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
    <DataGrid.Root table={table} onColumnActivate={onColumnActivate}>
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Sortable people">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  );
}

function KeyboardSortableDataGrid({ onSortingChange }: { onSortingChange: () => void }) {
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    onSortingChange,
  });

  return (
    <DataGrid.Root table={table}>
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Sortable people">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  );
}

function DismissibleColumnDataGrid() {
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <DataGrid.Root
      table={table}
      activeColumnId={activeColumnId}
      onColumnActivate={setActiveColumnId}
    >
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Dismissible columns">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  );
}

function SelectionHitAreaDataGrid({ onCellActivate }: {
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
    <DataGrid.Root table={table} onCellActivate={onCellActivate}>
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Selectable people">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  );
}

function FixedGeometryDataGrid() {
  const fixedColumns = [
    columnHelper.accessor("name", { header: "Name", size: 120 }),
    columnHelper.accessor("role", { header: "Role", size: 180 }),
  ];
  const table = useReactTable({
    columns: fixedColumns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          table.setColumnSizing({ name: 220 });
        }}
      >
        Resize name
      </button>
      <button
        type="button"
        onClick={() => {
          table.setColumnOrder(["role", "name"]);
        }}
      >
        Move role first
      </button>
      <button
        type="button"
        onClick={() => {
          table.setColumnVisibility({ role: false });
        }}
      >
        Hide role
      </button>
      <DataGrid.Root table={table}>
        <DataGrid.Viewport>
          <DataGrid.Table aria-label="Fixed geometry people">
            <DataGrid.Content />
          </DataGrid.Table>
        </DataGrid.Viewport>
      </DataGrid.Root>
    </>
  );
}

function ReorderableDataGrid({
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
    <DataGrid.Root
      table={table}
      columnDragPreview={columnDragPreview}
      columnOrder={columnOrder}
      onColumnOrderChange={(nextColumnOrder) => {
        setColumnOrder(nextColumnOrder);
        onColumnOrderChange(nextColumnOrder);
      }}
    >
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Reorderable people">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  );
}

afterEach(() => {
  cleanup();
  contextRenderCount.current = 0;
  dragOverlayDropAnimation = undefined;
  dragOverlaySource = { id: "name" };
  droppingSortableId = null;
  onDataGridDragEnd = undefined;
  onDataGridDragOver = undefined;
  onDataGridDragStart = undefined;
  sortableInputs.length = 0;
  sortableTargetRefs.clear();
});

describe("DataGrid", () => {
  it("rejects duplicate reorder column ids", () => {
    expect(() =>
      render(
        <ReorderableDataGrid
          initialColumnOrder={["name", "name"]}
          onColumnOrderChange={() => undefined}
        />,
      ),
    ).toThrow("DataGrid columnOrder values must be unique");
  });

  it("preserves the focused header when reorder behavior loads", async () => {
    render(<ReorderableDataGrid onColumnOrderChange={() => undefined} />);
    const header = screen.getByRole("columnheader", { name: "Name" });
    header.focus();
    expect(header.hasAttribute("data-reorderable")).toBe(false);

    await waitFor(() => {
      expect(onDataGridDragStart).toBeTypeOf("function");
    });

    const reorderedHeader = screen.getByRole("columnheader", { name: "Name" });
    expect(document.activeElement).toBe(reorderedHeader);
    expect(reorderedHeader.hasAttribute("data-reorderable")).toBe(true);
  });

  it("preserves context identity until a meaningful input changes", () => {
    render(<StableContextDataGrid />);

    expect(contextRenderCount.current).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Rerender" }));

    expect(contextRenderCount.current).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Activate column" }));

    expect(contextRenderCount.current).toBe(2);
  });

  it("renders semantic headers, rows, and visible cells from TanStack state", () => {
    render(<TestDataGrid />);

    expect(screen.getByRole("table", { name: "People" })).toBeTruthy();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("cell", { name: "Ada" })).toBeTruthy();
  });

  it("uses one explicit column geometry without redistributing unaffected columns", () => {
    render(<FixedGeometryDataGrid />);

    const table = screen.getByRole("table", { name: "Fixed geometry people" });
    const scrollSurface = table.closest('[data-slot="data-grid-scroll-surface"]');
    const columns = table.querySelectorAll("col");

    expect(scrollSurface).not.toBeNull();
    expect((scrollSurface as HTMLElement).style.width).toBe("300px");
    expect(table.style.width).toBe("300px");
    expect(Array.from(columns, (column) => column.style.width)).toEqual(["120px", "180px"]);
    expect(table.querySelectorAll('[data-slot="data-grid-filler-cell"]')).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Resize name" }));

    expect((scrollSurface as HTMLElement).style.width).toBe("400px");
    expect(table.style.width).toBe("400px");
    expect(Array.from(columns, (column) => column.style.width)).toEqual(["220px", "180px"]);
  });

  it("updates shared column geometry for reordered and hidden columns", () => {
    render(<FixedGeometryDataGrid />);

    const table = screen.getByRole("table", { name: "Fixed geometry people" });

    fireEvent.click(screen.getByRole("button", { name: "Move role first" }));

    expect(Array.from(table.querySelectorAll("col"), (column) => column.style.width)).toEqual([
      "180px",
      "120px",
    ]);
    expect(table.style.width).toBe("300px");

    fireEvent.click(screen.getByRole("button", { name: "Hide role" }));

    expect(Array.from(table.querySelectorAll("col"), (column) => column.style.width)).toEqual([
      "120px",
    ]);
    expect(table.style.width).toBe("120px");
  });

  it("renders explicit loading and empty content", () => {
    const { rerender } = render(<TestDataGrid loading />);

    expect(screen.getByText("Loading people")).toBeTruthy();

    rerender(<TestDataGrid data={[]} />);

    expect(screen.getByText("No people")).toBeTruthy();
  });

  it("gives active-cell state precedence over column highlighting", () => {
    render(
      <TestDataGrid
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
    render(<TestDataGrid activeColumnId="role" />);

    const activeHeader = screen.getByRole("columnheader", { name: "Role" });
    const activeColumnCell = screen.getByRole("cell", { name: "Engineer" });

    expect(activeHeader.hasAttribute("data-active")).toBe(true);
    expect(activeColumnCell.hasAttribute("data-column-active")).toBe(true);
  });

  it("keeps resize emphasis on the header-owned border", () => {
    const { rerender } = render(<TestDataGrid activeColumnId="role" />);

    const restingHandleClassName = screen.getByRole("button", {
      name: "Resize role column",
    }).className;

    rerender(<TestDataGrid activeColumnId="role" resizingColumnId="role" />);

    const resizeHandle = screen.getByRole("button", { name: "Resize role column" });

    expect(resizeHandle.hasAttribute("data-resizing")).toBe(true);
    expect(resizeHandle.className).toBe(restingHandleClassName);
  });

  it("reports header, row, cell, and cell context-menu activation targets", () => {
    const onColumnActivate = vi.fn();
    const onRowActivate = vi.fn();
    const onCellActivate = vi.fn();
    const onCellContextMenu = vi.fn();

    render(
      <TestDataGrid
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
    render(<TestDataGrid onCellActivate={onCellActivate} />);
    const cell = screen.getByRole("cell", { name: "Engineer" });

    fireEvent.click(cell, { detail: 1 });
    fireEvent.click(cell, { detail: 2 });
    fireEvent.doubleClick(cell);

    expect(onCellActivate).toHaveBeenCalledOnce();
  });

  it("reports additive and range cell-selection intent from click modifiers", () => {
    const onCellActivate = vi.fn();
    render(<TestDataGrid onCellActivate={onCellActivate} />);
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
      <TestDataGrid
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
    render(<ReorderableDataGrid onColumnOrderChange={vi.fn()} />);
    const cell = screen.getByRole("cell", { name: "Engineer" });

    await waitFor(() => {
      expect(sortableTargetRefs.get("person-1:role")).toHaveBeenCalledWith(cell);
    });
  });

  it("supports expanded content through manual compound composition", () => {
    render(<ExpandedTestDataGrid />);

    const details = screen.getByRole("cell", { name: "Ada details" });
    expect(details.getAttribute("colspan")).toBe("2");
  });

  it("activates a column when its interactive header content is used", () => {
    const onColumnActivate = vi.fn();
    render(<InteractiveHeaderDataGrid onColumnActivate={onColumnActivate} />);

    fireEvent.click(screen.getByRole("button", { name: "Sort name" }));

    expect(onColumnActivate).toHaveBeenCalledWith("name");
  });

  it("deactivates a column when its active header is clicked again", () => {
    render(<DismissibleColumnDataGrid />);
    const header = screen.getByRole("columnheader", { name: "Role" });

    fireEvent.click(header);
    expect(header.hasAttribute("data-active")).toBe(true);

    fireEvent.click(header);
    expect(header.hasAttribute("data-active")).toBe(false);
  });

  it("deactivates a column when a pointer press occurs outside the table", () => {
    render(<DismissibleColumnDataGrid />);
    const header = screen.getByRole("columnheader", { name: "Role" });

    fireEvent.click(header);
    fireEvent.pointerDown(document.body);

    expect(header.hasAttribute("data-active")).toBe(false);
  });

  it("uses the complete checkbox cell as the selection hit area", () => {
    const onCellActivate = vi.fn();
    render(<SelectionHitAreaDataGrid onCellActivate={onCellActivate} />);
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
    render(<ReorderableDataGrid onColumnOrderChange={onColumnOrderChange} />);

    await waitFor(() => {
      expect(onDataGridDragOver).toBeTypeOf("function");
    });

    act(() => {
      onDataGridDragStart?.({ operation: {} });
      onDataGridDragOver?.({
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
    render(<ReorderableDataGrid onColumnOrderChange={onColumnOrderChange} />);

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
      <ReorderableDataGrid
        columnDragPreview={(columnId) => <span>{`Marker ${columnId}`}</span>}
        onColumnOrderChange={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("column-drag-overlay").textContent).toBe("Marker name");
    });
  });

  it("gives reorderable body cells row-scoped sortable transitions without making them draggable", async () => {
    render(<ReorderableDataGrid onColumnOrderChange={() => undefined} />);

    await waitFor(() => {
      expect(sortableInputs).toContainEqual({
        accept: "column-cell",
        id: "person-1:role",
        index: 1,
        group: "data-grid-row:person-1",
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
    render(<ReorderableDataGrid onColumnOrderChange={() => undefined} />);

    await waitFor(() => {
      const header = document.querySelector<HTMLElement>('[data-column-id="name"]');
      expect(header).not.toBeNull();
      const source = header?.querySelector<HTMLElement>(
        '[data-slot="data-grid-header-drag-source"]',
      );
      expect(header?.hasAttribute("data-dragging")).toBe(true);
      expect(source).not.toBeNull();
      expect(source?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  it("reports sort state and toggles sorting from a focused header with Enter", () => {
    const onSortingChange = vi.fn();
    render(<KeyboardSortableDataGrid onSortingChange={onSortingChange} />);

    const header = screen.getByRole("columnheader", { name: "Name" });
    expect(header.getAttribute("aria-sort")).toBe("none");
    header.focus();
    fireEvent.keyDown(header, { key: "Enter" });

    expect(onSortingChange).toHaveBeenCalledOnce();
  });

  it("does not animate the drag overlay after the pointer is released", async () => {
    render(<ReorderableDataGrid onColumnOrderChange={() => undefined} />);

    await waitFor(() => {
      expect(dragOverlayDropAnimation).toBeNull();
    });
  });

  it("restores the complete column order when a drag is canceled", async () => {
    const onColumnOrderChange = vi.fn();
    render(<ReorderableDataGrid onColumnOrderChange={onColumnOrderChange} />);

    await waitFor(() => {
      expect(onDataGridDragOver).toBeTypeOf("function");
    });

    act(() => {
      onDataGridDragStart?.({ operation: {} });
      onDataGridDragOver?.({
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
      onDataGridDragEnd?.({ canceled: true, operation: {} });
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
