import * as stylex from "@stylexjs/stylex";
import type { Cell, Header, HeaderGroup, Row, RowData, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import { dataTableStyles } from "./dataTable.styles";
import {
  asStable,
  DataTableContext,
  type DataTableContextValue,
  type Stable,
  useDataTableContext,
} from "./dataTableContext";
import { useDataTableReorderContext } from "./dataTableReorderContext";

export type DataTableDensity = "compact" | "default";

/**
 * Why: importing DND from this static module pulled the shared sortable chunk into the initial
 * application load. A sibling-runtime alternative kept the chunk deferred but depended on DOM
 * queries, mutation observers, and external element registration.
 *
 * How: the DND implementation loads after mount and wraps the table. Its context supplies small
 * components that attach `useSortable` directly to each owning header and cell ref.
 *
 * What: the first render stays static, then the table remounts once with reorder behavior. The
 * focused column is recorded and restored after that remount.
 */
type DataTableReorderModule = typeof import("./dataTableReorder");

let dataTableReorderModule: Promise<DataTableReorderModule> | undefined;

function loadDataTableReorder(): Promise<DataTableReorderModule> {
  dataTableReorderModule ??= import("./dataTableReorder").catch((error: unknown) => {
    dataTableReorderModule = undefined;
    throw error;
  });
  return dataTableReorderModule;
}

export interface DataTableCellTarget {
  columnId: string;
  rowId: string;
}

const emptySelectedCells: readonly DataTableCellTarget[] = [];

export type DataTableCellSelectionMode = "additive" | "range" | "replace";

export type DataTableHeaderContextMenuHandler = (
  columnId: string,
  event: MouseEvent<HTMLTableCellElement>,
) => void;
export type DataTableRowContextMenuHandler = (
  rowId: string,
  event: MouseEvent<HTMLTableRowElement>,
) => void;
export type DataTableCellContextMenuHandler = (
  target: DataTableCellTarget,
  event: MouseEvent<HTMLTableCellElement>,
) => void;

interface DataTableRootBaseProps<TData extends RowData> {
  /** Active row and column intersection. */
  activeCell?: DataTableCellTarget | null;
  /** Column highlighted across the header and visible rows. */
  activeColumnId?: string | null;
  /** Row currently targeted for inspection. */
  activeRowId?: string | null;
  /** Data-table regions and companion controls. */
  children: ReactNode;
  /** Controls table row and cell spacing. */
  density?: DataTableDensity;
  /** Runs when a non-interactive cell is activated. */
  onCellActivate?: (target: DataTableCellTarget, selectionMode: DataTableCellSelectionMode) => void;
  /** Runs when a cell context menu is requested. */
  onCellContextMenu?: DataTableCellContextMenuHandler;
  /** Runs when a column header is activated. */
  onColumnActivate?: (columnId: string | null) => void;
  /** Runs when a column-header context menu is requested. */
  onHeaderContextMenu?: DataTableHeaderContextMenuHandler;
  /** Runs when a non-interactive row is activated. */
  onRowActivate?: (rowId: string) => void;
  /** Runs when a row context menu is requested. */
  onRowContextMenu?: DataTableRowContextMenuHandler;
  /** Controlled TanStack table instance rendered by the compound parts. */
  table: Table<TData>;
  /** Cells included in the current cell-selection set. */
  selectedCells?: readonly DataTableCellTarget[];
}

interface ReorderableDataTableRootProps {
  /** Column ids in their controlled draggable order. Omit fixed columns from this list. */
  columnOrder: readonly string[];
  /** Runs with the complete draggable column order after a header is moved. */
  onColumnOrderChange: (columnIds: string[]) => void;
}

interface StaticDataTableRootProps {
  columnOrder?: never;
  onColumnOrderChange?: never;
}

export type DataTableRootProps<TData extends RowData> = DataTableRootBaseProps<TData> &
  (ReorderableDataTableRootProps | StaticDataTableRootProps);

export interface DataTableViewportProps {
  /** Table or custom viewport content. */
  children: ReactNode;
}

export interface DataTableTableProps {
  /** Accessible name for the table. */
  "aria-label": string;
  /** Header and body composition. */
  children: ReactNode;
}

export interface DataTableContentProps {
  /** Content shown when the table has no rows. */
  emptyContent?: ReactNode;
  /** Whether loading content replaces the current row model. */
  loading?: boolean;
  /** Content shown while rows are loading. */
  loadingContent?: ReactNode;
}

export interface DataTableHeaderProps {
  /** Custom header rows. TanStack header groups render when omitted. */
  children?: ReactNode;
}

export interface DataTableHeaderRowProps<TData extends RowData> {
  /** Custom header cells. TanStack headers render when omitted. */
  children?: ReactNode;
  /** TanStack header group represented by this row. */
  headerGroup: HeaderGroup<TData>;
}

export interface DataTableHeaderCellProps<TData extends RowData> {
  /** Custom header content. The column header definition renders when omitted. */
  children?: ReactNode;
  /** TanStack header represented by this cell. */
  header: Header<TData, unknown>;
}

export interface DataTableBodyProps {
  /** Custom rows. TanStack rows render when omitted. */
  children?: ReactNode;
}

export interface DataTableRowProps<TData extends RowData> {
  /** Custom cells. Visible TanStack cells render when omitted. */
  children?: ReactNode;
  /** TanStack row represented by this table row. */
  row: Row<TData>;
}

export interface DataTableCellProps<TData extends RowData> {
  /** Custom cell content. The column cell definition renders when omitted. */
  children?: ReactNode;
  /** TanStack cell represented by this table cell. */
  cell: Cell<TData, unknown>;
}

export interface DataTableExpandedRowProps<TData extends RowData> {
  /** Expanded content associated with the row. */
  children: ReactNode;
  /** TanStack row represented by this expanded region. */
  row: Row<TData>;
}

export interface DataTableMessageProps {
  /** Loading or empty-state content. */
  children: ReactNode;
}

export interface DataTableFooterProps {
  /** Status and table companion controls. */
  children: ReactNode;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (target instanceof Element === false) {
    return false;
  }

  return (
    target.closest('a, button, input, select, textarea, [role="button"], [role="checkbox"]') !==
    null
  );
}

function isSelectionControlTarget(target: EventTarget | null): boolean {
  if (target instanceof Element === false) {
    return false;
  }

  return target.closest('input, [role="checkbox"], [role="radio"]') !== null;
}

function activateSelectionControlFromCell(event: MouseEvent<HTMLTableCellElement>): boolean {
  const selectionControl = event.currentTarget.querySelector<HTMLElement>(
    'input[type="checkbox"], [role="checkbox"]',
  );
  if (selectionControl === null) {
    return false;
  }

  event.stopPropagation();
  if (isSelectionControlTarget(event.target) === false) {
    selectionControl.focus();
    selectionControl.dispatchEvent(
      new globalThis.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      }),
    );
  }
  return true;
}

function getVisibleColumnCount<TData extends RowData>(table: Table<TData>): number {
  return Math.max(table.getVisibleLeafColumns().length, 1);
}

function DataTableRoot<TData extends RowData>({
  activeCell = null,
  activeColumnId = null,
  activeRowId = null,
  children,
  columnOrder,
  density = "default",
  onCellActivate,
  onCellContextMenu,
  onColumnActivate,
  onColumnOrderChange,
  onHeaderContextMenu,
  onRowActivate,
  onRowContextMenu,
  selectedCells = emptySelectedCells,
  table,
}: DataTableRootProps<TData>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const focusedColumnIdRef = useRef<string | null>(null);
  const onColumnActivateRef = useRef(onColumnActivate);
  const [ReorderComponent, setReorderComponent] = useState<
    DataTableReorderModule["DataTableReorder"] | null
  >(null);
  const columnReorderIndices = useMemo(
    () => new Map(columnOrder?.map((columnId, index) => [columnId, index]) ?? []),
    [columnOrder],
  );
  if (columnOrder !== undefined && columnReorderIndices.size !== columnOrder.length) {
    throw new Error("DataTable columnOrder values must be unique");
  }

  const columnReorderConfigured = columnOrder !== undefined && onColumnOrderChange !== undefined;
  const columnReorderReady = ReorderComponent !== null;
  const columnReorderEnabled = columnReorderConfigured === true && columnReorderReady === true;
  const selectedColumnsByRow = useMemo(() => {
    const columnsByRow = new Map<string, Set<string>>();

    for (const cell of selectedCells) {
      const columns = columnsByRow.get(cell.rowId) ?? new Set<string>();
      columns.add(cell.columnId);
      columnsByRow.set(cell.rowId, columns);
    }

    return columnsByRow;
  }, [selectedCells]);
  /**
   * Why: React compares context values by reference. Recreating this object on every Root render
   * would notify every compound DataTable part even when no table input changed.
   *
   * How: useMemo retains the object while every field used to build it is unchanged. Derived
   * functions are created inside the memo so their identities follow the same dependency set.
   *
   * What: asStable records that runtime guarantee in the context type. It does not make the
   * mutable TanStack Table instance immutable; it only preserves this wrapper's identity across
   * unrelated renders. Consumers therefore avoid context-driven renders and can safely depend on
   * the complete context reference instead of reconstructing their own stability assumptions.
   */
  const value = useMemo(
    () =>
      asStable({
        activeCell,
        activeColumnId,
        activeRowId,
        density,
        onCellActivate,
        onCellContextMenu,
        onColumnActivate,
        onHeaderContextMenu,
        onRowActivate,
        onRowContextMenu,
        selectedColumnsByRow,
        columnReorderEnabled,
        getColumnReorderIndex: (columnId: string) => columnReorderIndices.get(columnId) ?? -1,
        table,
      } satisfies DataTableContextValue<TData>),
    [
      activeCell,
      activeColumnId,
      activeRowId,
      columnReorderEnabled,
      columnReorderIndices,
      density,
      onCellActivate,
      onCellContextMenu,
      onColumnActivate,
      onHeaderContextMenu,
      onRowActivate,
      onRowContextMenu,
      selectedColumnsByRow,
      table,
    ],
  );

  useEffect(() => {
    onColumnActivateRef.current = onColumnActivate;
  }, [onColumnActivate]);

  useEffect(() => {
    if (columnReorderConfigured === false || ReorderComponent !== null) {
      return;
    }

    let active = true;
    void loadDataTableReorder()
      .then((module) => {
        if (active === true) {
          const activeElement = document.activeElement;
          if (
            activeElement instanceof Element &&
            rootRef.current?.contains(activeElement) === true
          ) {
            focusedColumnIdRef.current =
              activeElement.closest<HTMLElement>("[data-column-id]")?.dataset.columnId ?? null;
          }
          setReorderComponent(() => module.DataTableReorder);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to load DataTable reorder behavior", error);
      });

    return () => {
      active = false;
    };
  }, [ReorderComponent, columnReorderConfigured]);

  useLayoutEffect(() => {
    const focusedColumnId = focusedColumnIdRef.current;
    if (ReorderComponent === null || focusedColumnId === null) {
      return;
    }
    const focusedCell = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>("[data-column-id]") ?? [],
    ).find((cell) => cell.dataset.columnId === focusedColumnId);
    focusedCell?.focus();
    focusedColumnIdRef.current = null;
  }, [ReorderComponent]);

  useEffect(() => {
    if (activeColumnId === null || onColumnActivateRef.current === undefined) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target) === true) {
        return;
      }

      onColumnActivateRef.current?.(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onColumnActivateRef.current?.(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeColumnId]);

  const root = (
    <DataTableContext.Provider value={value as Stable<DataTableContextValue<RowData>>}>
      <div
        {...stylex.props(dataTableStyles.root)}
        data-density={density}
        data-slot="data-table"
        ref={rootRef}
      >
        {children}
      </div>
    </DataTableContext.Provider>
  );

  if (
    columnReorderEnabled === false ||
    columnOrder === undefined ||
    onColumnOrderChange === undefined
  ) {
    return root;
  }

  return (
    <ReorderComponent
      columnOrder={columnOrder}
      onColumnOrderChange={onColumnOrderChange}
      overlayProps={stylex.props(dataTableStyles.columnDragOverlay)}
      rootRef={rootRef}
      renderOverlay={(source) => (
        <div
          {...stylex.props(
            dataTableStyles.headerDragContent,
            dataTableStyles.columnDragOverlayContent,
            density === "compact" && dataTableStyles.compactHeaderDragContent,
          )}
        >
          {source.element?.textContent ?? String(source.id)}
        </div>
      )}
    >
      {root}
    </ReorderComponent>
  );
}

function DataTableViewport({ children }: DataTableViewportProps) {
  return (
    <div {...stylex.props(dataTableStyles.viewport)} data-slot="data-table-viewport">
      {children}
    </div>
  );
}

function DataTableTable({ "aria-label": ariaLabel, children }: DataTableTableProps) {
  return (
    <table
      {...stylex.props(dataTableStyles.table)}
      aria-label={ariaLabel}
      data-slot="data-table-table"
    >
      {children}
    </table>
  );
}

function DataTableContent({
  emptyContent = "No data available",
  loading = false,
  loadingContent = "Loading data",
}: DataTableContentProps) {
  const { table } = useDataTableContext();

  return (
    <>
      <DataTableHeader />
      {loading === true ? (
        <DataTableLoading>{loadingContent}</DataTableLoading>
      ) : table.getRowModel().rows.length === 0 ? (
        <DataTableEmpty>{emptyContent}</DataTableEmpty>
      ) : (
        <DataTableBody />
      )}
    </>
  );
}

function DataTableHeader({ children }: DataTableHeaderProps) {
  const { table } = useDataTableContext();

  return (
    <thead {...stylex.props(dataTableStyles.header)} data-slot="data-table-header">
      {children ??
        table
          .getHeaderGroups()
          .map((headerGroup) => (
            <DataTableHeaderRow key={headerGroup.id} headerGroup={headerGroup} />
          ))}
    </thead>
  );
}

function DataTableHeaderRow<TData extends RowData>({
  children,
  headerGroup,
}: DataTableHeaderRowProps<TData>) {
  return (
    <tr data-slot="data-table-header-row">
      {children ??
        headerGroup.headers.map((header) => (
          <DataTableHeaderCell key={header.id} header={header} />
        ))}
    </tr>
  );
}

function DataTableHeaderCell<TData extends RowData>({
  children,
  header,
}: DataTableHeaderCellProps<TData>) {
  const reorderContext = useDataTableReorderContext();
  const {
    activeCell,
    activeColumnId,
    columnReorderEnabled,
    density,
    getColumnReorderIndex,
    onColumnActivate,
    onHeaderContextMenu,
  } = useDataTableContext<TData>();
  const isActive = activeCell === null && activeColumnId === header.column.id;
  const columnReorderIndex = getColumnReorderIndex(header.column.id);
  const columnReorderable = columnReorderEnabled === true && columnReorderIndex >= 0;

  const handleClick = (event: MouseEvent<HTMLTableCellElement>) => {
    if (activateSelectionControlFromCell(event) === true) {
      return;
    }

    if (isInteractiveTarget(event.target) === false) {
      event.currentTarget.focus();
    }

    onColumnActivate?.(isActive === true ? null : header.column.id);
  };

  const handleContextMenu = (event: MouseEvent<HTMLTableCellElement>) => {
    if (onHeaderContextMenu === undefined) {
      return;
    }

    event.preventDefault();
    onHeaderContextMenu(header.column.id, event);
  };

  const renderHeaderCell = ({
    isDragSource = false,
    isDropping = false,
    setReorderRef,
  }: {
    isDragSource?: boolean;
    isDropping?: boolean;
    setReorderRef?: (element: HTMLTableCellElement | null) => void;
  } = {}) => {
    const isDragVisual = isDragSource === true || isDropping === true;

    return (
      <th
        ref={setReorderRef}
        {...stylex.props(
          dataTableStyles.headerCell,
          density === "compact" && dataTableStyles.compactCell,
          dataTableStyles.headerCellLayout,
          isActive === true && dataTableStyles.headerCellActive,
          columnReorderable === true && dataTableStyles.headerCellReorderable,
          isDragVisual === true && dataTableStyles.headerCellDragging,
        )}
        colSpan={header.colSpan}
        data-active={isActive === true ? "" : undefined}
        data-column-id={header.column.id}
        data-dragging={isDragVisual === true ? "" : undefined}
        data-reorderable={columnReorderable === true ? "" : undefined}
        data-slot="data-table-header-cell"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        scope="col"
        style={{ width: header.getSize() }}
        tabIndex={-1}
      >
        <div
          {...stylex.props(
            dataTableStyles.headerDragContent,
            dataTableStyles.headerDragSource,
            density === "compact" && dataTableStyles.compactHeaderDragContent,
            isDragVisual === true && dataTableStyles.headerDragSourceDragging,
          )}
          data-slot="data-table-header-drag-source"
        >
          {header.isPlaceholder === true
            ? null
            : (children ?? flexRender(header.column.columnDef.header, header.getContext()))}
        </div>
        {header.column.getCanResize() === true ? (
          <button
            {...stylex.props(
              dataTableStyles.resizeHandle,
              header.column.getIsResizing() === true && dataTableStyles.resizeHandleActive,
              isDragVisual === true && dataTableStyles.resizeHandleDragging,
            )}
            aria-label={`Resize ${header.column.id} column`}
            data-resizing={header.column.getIsResizing() === true ? "" : undefined}
            data-slot="data-table-resize-handle"
            onClick={(event) => {
              event.stopPropagation();
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              header.column.resetSize();
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
              header.getResizeHandler()(event);
            }}
            onTouchStart={(event) => {
              event.stopPropagation();
              header.getResizeHandler()(event);
            }}
            type="button"
          />
        ) : null}
      </th>
    );
  };

  const SortableHeader = reorderContext.Header;
  if (SortableHeader !== null && columnReorderable === true) {
    return (
      <SortableHeader columnId={header.column.id} index={columnReorderIndex}>
        {renderHeaderCell}
      </SortableHeader>
    );
  }

  return renderHeaderCell();
}

function DataTableBody({ children }: DataTableBodyProps) {
  const { table } = useDataTableContext();

  return (
    <tbody data-slot="data-table-body">
      {children ?? table.getRowModel().rows.map((row) => <DataTableRow key={row.id} row={row} />)}
    </tbody>
  );
}

function DataTableRow<TData extends RowData>({ children, row }: DataTableRowProps<TData>) {
  const { activeRowId, onColumnActivate, onRowActivate, onRowContextMenu } =
    useDataTableContext<TData>();
  const isActive = activeRowId === row.id;
  const isSelected = row.getIsSelected();

  const handleClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (isInteractiveTarget(event.target) === true) {
      return;
    }

    onColumnActivate?.(null);
    onRowActivate?.(row.id);
  };

  const handleContextMenu = (event: MouseEvent<HTMLTableRowElement>) => {
    if (onRowContextMenu === undefined || event.defaultPrevented === true) {
      return;
    }

    event.preventDefault();
    onRowContextMenu(row.id, event);
  };

  return (
    <tr
      {...stylex.props(
        dataTableStyles.row,
        isSelected === true && dataTableStyles.rowSelected,
        isActive === true && dataTableStyles.rowActive,
      )}
      aria-selected={isSelected}
      data-active={isActive === true ? "" : undefined}
      data-selected={isSelected === true ? "" : undefined}
      data-slot="data-table-row"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {children ?? row.getVisibleCells().map((cell) => <DataTableCell key={cell.id} cell={cell} />)}
    </tr>
  );
}

function DataTableCell<TData extends RowData>({ children, cell }: DataTableCellProps<TData>) {
  const reorderContext = useDataTableReorderContext();
  const {
    activeCell,
    activeColumnId,
    activeRowId,
    columnReorderEnabled,
    density,
    getColumnReorderIndex,
    onCellActivate,
    onCellContextMenu,
    onColumnActivate,
    selectedColumnsByRow,
  } = useDataTableContext<TData>();
  const target = { rowId: cell.row.id, columnId: cell.column.id };
  const isColumnActive = activeCell === null && activeColumnId === target.columnId;
  const isRowActive = activeRowId === target.rowId;
  const isSelected = cell.row.getIsSelected();
  const isCellSelected = selectedColumnsByRow.get(target.rowId)?.has(target.columnId) === true;
  const isActive = activeCell?.rowId === target.rowId && activeCell.columnId === target.columnId;
  const columnReorderIndex = getColumnReorderIndex(target.columnId);
  const columnReorderable = columnReorderEnabled === true && columnReorderIndex >= 0;

  const handleClick = (event: MouseEvent<HTMLTableCellElement>) => {
    if (event.detail > 1) {
      event.stopPropagation();
      return;
    }

    if (activateSelectionControlFromCell(event) === true) {
      return;
    }

    if (isInteractiveTarget(event.target) === true) {
      return;
    }

    event.stopPropagation();
    event.currentTarget.focus();
    onColumnActivate?.(null);
    const selectionMode: DataTableCellSelectionMode =
      event.metaKey === true || event.ctrlKey === true
        ? "additive"
        : event.shiftKey === true
          ? "range"
          : "replace";
    onCellActivate?.(target, selectionMode);
  };

  const handleContextMenu = (event: MouseEvent<HTMLTableCellElement>) => {
    if (onCellContextMenu === undefined) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onCellContextMenu(target, event);
  };

  const renderCell = (setReorderRef?: (element: HTMLTableCellElement | null) => void) => (
    <td
      ref={setReorderRef}
      {...stylex.props(
        dataTableStyles.cell,
        density === "compact" && dataTableStyles.compactCell,
        isColumnActive === true && dataTableStyles.cellColumnActive,
        isSelected === true && dataTableStyles.cellSelected,
        isCellSelected === true && dataTableStyles.cellSelection,
        isActive === true && dataTableStyles.cellActive,
      )}
      data-active={isActive === true ? "" : undefined}
      data-cell-selected={isCellSelected === true ? "" : undefined}
      data-column-id={target.columnId}
      data-column-active={isColumnActive === true ? "" : undefined}
      data-row-active={isRowActive === true ? "" : undefined}
      data-selected={isSelected === true ? "" : undefined}
      data-slot="data-table-cell"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{ width: cell.column.getSize() }}
      tabIndex={-1}
    >
      {children ?? flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );

  const DroppableCell = reorderContext.Cell;
  if (DroppableCell !== null && columnReorderable === true) {
    return (
      <DroppableCell columnId={target.columnId} index={columnReorderIndex} rowId={target.rowId}>
        {renderCell}
      </DroppableCell>
    );
  }

  return renderCell();
}

function DataTableExpandedRow<TData extends RowData>({
  children,
  row,
}: DataTableExpandedRowProps<TData>) {
  return (
    <tr data-parent-row-id={row.id} data-slot="data-table-expanded-row">
      <td
        {...stylex.props(dataTableStyles.expandedCell)}
        colSpan={Math.max(row.getVisibleCells().length, 1)}
        data-slot="data-table-expanded-cell"
      >
        {children}
      </td>
    </tr>
  );
}

function DataTableEmpty({ children }: DataTableMessageProps) {
  const { table } = useDataTableContext();

  return (
    <tbody data-slot="data-table-empty">
      <tr>
        <td {...stylex.props(dataTableStyles.messageCell)} colSpan={getVisibleColumnCount(table)}>
          {children}
        </td>
      </tr>
    </tbody>
  );
}

function DataTableLoading({ children }: DataTableMessageProps) {
  const { table } = useDataTableContext();

  return (
    <tbody aria-busy="true" data-slot="data-table-loading">
      <tr>
        <td {...stylex.props(dataTableStyles.messageCell)} colSpan={getVisibleColumnCount(table)}>
          {children}
        </td>
      </tr>
    </tbody>
  );
}

function DataTableFooter({ children }: DataTableFooterProps) {
  return (
    <div {...stylex.props(dataTableStyles.footer)} data-slot="data-table-footer">
      {children}
    </div>
  );
}

export const DataTable = Object.assign(DataTableRoot, {
  Root: DataTableRoot,
  Body: DataTableBody,
  Cell: DataTableCell,
  Content: DataTableContent,
  Empty: DataTableEmpty,
  ExpandedRow: DataTableExpandedRow,
  Footer: DataTableFooter,
  Header: DataTableHeader,
  HeaderCell: DataTableHeaderCell,
  HeaderRow: DataTableHeaderRow,
  Loading: DataTableLoading,
  Row: DataTableRow,
  Table: DataTableTable,
  Viewport: DataTableViewport,
});
