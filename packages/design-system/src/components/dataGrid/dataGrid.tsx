import * as stylex from '@stylexjs/stylex'
import {
  FlexRender,
  Subscribe,
  type Cell,
  type Header,
  type HeaderGroup,
  type Row,
  type RowData,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

import { ScrollAreaPrivate } from '../scrollArea/scrollArea'
import { Spinner } from '../spinner/spinner'
import { dataGridStyles } from './dataGrid.styles'
import { DataGridContext, type DataGridContextValue, useDataGridContext } from './dataGridContext'
import type { DataGridFeatures, DataGridTable } from './dataGridFeatures'
import { useDataGridReorderContext } from './dataGridReorderContext'

export type DataGridDensity = 'compact' | 'default'
export type DataGridRowRendering = 'all' | 'virtual'

/**
 * Why: importing DND from this static module pulled the shared sortable chunk into the initial
 * application load. A sibling-runtime alternative kept the chunk deferred but depended on DOM
 * queries, mutation observers, and external element registration.
 *
 * How: the DND implementation loads after mount and wraps the table. Its context supplies small
 * components that attach `useSortable` directly to each owning header ref.
 *
 * What: the first render stays static, then the table remounts once with reorder behavior. The
 * focused column is recorded and restored after that remount.
 */
type DataGridReorderModule = typeof import('./dataGridReorder')

let dataGridReorderModule: Promise<DataGridReorderModule> | undefined

function loadDataGridReorder(): Promise<DataGridReorderModule> {
  dataGridReorderModule ??= import('./dataGridReorder').catch((error: unknown) => {
    dataGridReorderModule = undefined
    throw error
  })
  return dataGridReorderModule
}

export interface DataGridCellTarget {
  columnId: string
  rowId: string
}

export type DataGridHeaderContextMenuHandler = (
  columnId: string,
  event: MouseEvent<HTMLTableCellElement>,
) => void
export type DataGridRowContextMenuHandler = (
  rowId: string,
  event: MouseEvent<HTMLTableRowElement>,
) => void
export type DataGridCellContextMenuHandler = (
  target: DataGridCellTarget,
  event: MouseEvent<HTMLTableCellElement>,
) => void

interface DataGridRootBaseProps<TData extends RowData> {
  /** Column highlighted across the header and visible rows. */
  activeColumnId?: string | null
  /** Row currently targeted for inspection. */
  activeRowId?: string | null
  /** Data-table regions and companion controls. */
  children: ReactNode
  /** Controls table row and cell spacing. */
  density?: DataGridDensity
  /** Runs when a non-interactive cell is activated. */
  onCellActivate?: (target: DataGridCellTarget) => void
  /** Runs when a cell context menu is requested. */
  onCellContextMenu?: DataGridCellContextMenuHandler
  /** Runs when a column header is activated. */
  onColumnActivate?: (columnId: string | null) => void
  /** Runs when a column-header context menu is requested. */
  onHeaderContextMenu?: DataGridHeaderContextMenuHandler
  /** Runs when a non-interactive row is activated. */
  onRowActivate?: (rowId: string) => void
  /** Runs when a row context menu is requested. */
  onRowContextMenu?: DataGridRowContextMenuHandler
  /** Controlled TanStack table instance rendered by the compound parts. */
  table: DataGridTable<TData>
}

interface ReorderableDataGridRootProps {
  /** Renders the inert visual shown while a column header is dragged. */
  columnDragPreview?: (columnId: string) => ReactNode
  /** Leaf column ids that can be reordered. TanStack table state owns their current order. */
  reorderableColumnIds: readonly string[]
}

interface StaticDataGridRootProps {
  columnDragPreview?: never
  reorderableColumnIds?: never
}

export type DataGridRootProps<TData extends RowData> = DataGridRootBaseProps<TData> &
  (ReorderableDataGridRootProps | StaticDataGridRootProps)

export interface DataGridViewportProps {
  /** Table or custom viewport content. */
  children: ReactNode
  /** Changing this value resets both scroll axes without remounting the viewport content. */
  scrollResetKey?: string | number
}

export interface DataGridTableProps {
  /** Accessible name for the table. */
  'aria-label': string
  /** Header and body composition. */
  children: ReactNode
}

export interface DataGridContentProps {
  /** Content shown when the table has no rows. Pass `null` to render only the header. */
  emptyContent?: ReactNode
  /** Whether loading content replaces the current row model. */
  loading?: boolean
  /** Content shown while rows are loading. */
  loadingContent?: ReactNode
  /** Controls whether all rows render directly or larger row models use a virtual window. */
  rowRendering?: DataGridRowRendering
}

export interface DataGridHeaderProps {
  /** Custom header rows. TanStack header groups render when omitted. */
  children?: ReactNode
}

export interface DataGridHeaderRowProps<TData extends RowData> {
  /** Custom header cells. TanStack headers render when omitted. */
  children?: ReactNode
  /** TanStack header group represented by this row. */
  headerGroup: HeaderGroup<DataGridFeatures, TData>
}

export interface DataGridHeaderCellProps<TData extends RowData> {
  /** Custom header content. The column header definition renders when omitted. */
  children?: ReactNode
  /** TanStack header represented by this cell. */
  header: Header<DataGridFeatures, TData, unknown>
}

export interface DataGridBodyProps {
  /** Custom rows. TanStack rows render when omitted. */
  children?: ReactNode
}

export interface DataGridRowProps<TData extends RowData> {
  /** Custom cells. Visible TanStack cells render when omitted. */
  children?: ReactNode
  /** TanStack row represented by this table row. */
  row: Row<DataGridFeatures, TData>
}

export interface DataGridCellProps<TData extends RowData> {
  /** Custom cell content. The column cell definition renders when omitted. */
  children?: ReactNode
  /** TanStack cell represented by this table cell. */
  cell: Cell<DataGridFeatures, TData, unknown>
}

export interface DataGridExpandedRowProps<TData extends RowData> {
  /** Expanded content associated with the row. */
  children: ReactNode
  /** TanStack row represented by this expanded region. */
  row: Row<DataGridFeatures, TData>
}

export interface DataGridMessageProps {
  /** Loading or empty-state content. */
  children: ReactNode
}

export interface DataGridFooterProps {
  /** Status and table companion controls. */
  children: ReactNode
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (target instanceof Element === false) {
    return false
  }

  return (
    target.closest(
      'a, button, input, select, textarea, [contenteditable="true"], [role="button"], [role="checkbox"], [role="combobox"], [role="link"], [role="menuitem"], [role="option"], [role="radio"], [role="switch"], [role="textbox"]',
    ) !== null
  )
}

function isSelectionControlTarget(target: EventTarget | null): boolean {
  if (target instanceof Element === false) {
    return false
  }

  return target.closest('input, [role="checkbox"], [role="radio"]') !== null
}

function activateSelectionControlFromCell(event: MouseEvent<HTMLTableCellElement>): boolean {
  const selectionControl = event.currentTarget.querySelector<HTMLElement>(
    'input[type="checkbox"], [role="checkbox"]',
  )
  if (selectionControl === null) {
    return false
  }

  event.stopPropagation()
  if (isSelectionControlTarget(event.target) === false) {
    selectionControl.focus()
    selectionControl.dispatchEvent(
      new globalThis.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      }),
    )
  }
  return true
}

function getVisibleColumnCount<TData extends RowData>(table: DataGridTable<TData>): number {
  return Math.max(table.getVisibleLeafColumns().length, 1)
}

function moveColumnByOffset(
  columnOrder: readonly string[],
  visibleColumnOrder: readonly string[],
  columnId: string,
  offset: -1 | 1,
): string[] {
  const currentIndex = columnOrder.indexOf(columnId)
  const visibleIndex = visibleColumnOrder.indexOf(columnId)
  const nextVisibleIndex = visibleIndex + offset
  if (
    currentIndex < 0 ||
    visibleIndex < 0 ||
    nextVisibleIndex < 0 ||
    nextVisibleIndex >= visibleColumnOrder.length
  ) {
    return [...columnOrder]
  }
  const targetColumnId = visibleColumnOrder[nextVisibleIndex]
  if (targetColumnId === undefined) {
    return [...columnOrder]
  }
  const nextIndex = columnOrder.indexOf(targetColumnId)

  const nextColumnOrder = [...columnOrder]
  const [column] = nextColumnOrder.splice(currentIndex, 1)
  if (column !== undefined) {
    nextColumnOrder.splice(nextIndex, 0, column)
  }
  return nextColumnOrder
}

function mergeReorderableColumnOrder(
  completeColumnOrder: readonly string[],
  reorderableColumnIds: ReadonlySet<string>,
  nextReorderableColumnOrder: readonly string[],
): string[] {
  let nextReorderableIndex = 0
  return completeColumnOrder.map((columnId) => {
    if (reorderableColumnIds.has(columnId) === false) {
      return columnId
    }

    const nextColumnId = nextReorderableColumnOrder[nextReorderableIndex]
    nextReorderableIndex += 1
    return nextColumnId ?? columnId
  })
}

function DataGridRoot<TData extends RowData>({
  activeColumnId = null,
  activeRowId = null,
  children,
  columnDragPreview,
  density = 'default',
  onCellActivate,
  onCellContextMenu,
  onColumnActivate,
  onHeaderContextMenu,
  onRowActivate,
  onRowContextMenu,
  reorderableColumnIds,
  table,
}: DataGridRootProps<TData>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null)
  const focusedColumnIdRef = useRef<string | null>(null)
  const onColumnActivateRef = useRef(onColumnActivate)
  const [ReorderComponent, setReorderComponent] = useState<
    DataGridReorderModule['DataGridReorder'] | null
  >(null)
  const reorderableColumnIdSet = useMemo(
    () => new Set(reorderableColumnIds ?? []),
    [reorderableColumnIds],
  )
  if (
    reorderableColumnIds !== undefined &&
    reorderableColumnIdSet.size !== reorderableColumnIds.length
  ) {
    throw new Error('DataGrid reorderableColumnIds values must be unique')
  }
  const completeColumnOrder = useMemo(
    () => table.getAllLeafColumns().map((column) => column.id),
    [table],
  )
  const columnOrder = useMemo(
    () => completeColumnOrder.filter((columnId) => reorderableColumnIdSet.has(columnId)),
    [completeColumnOrder, reorderableColumnIdSet],
  )
  const columnReorderIndices = useMemo(
    () => new Map(columnOrder.map((columnId, index) => [columnId, index])),
    [columnOrder],
  )

  const columnReorderConfigured = reorderableColumnIds !== undefined
  const columnReorderReady = ReorderComponent !== null
  const columnReorderEnabled = columnReorderConfigured === true && columnReorderReady === true
  const value = useMemo(
    () =>
      ({
        activeColumnId,
        activeRowId,
        density,
        onCellActivate,
        onCellContextMenu,
        onColumnActivate,
        onHeaderContextMenu,
        onRowActivate,
        onRowContextMenu,
        columnReorderEnabled,
        getColumnReorderIndex: (columnId: string) => columnReorderIndices.get(columnId) ?? -1,
        moveColumn: (columnId: string, offset: -1 | 1) => {
          if (reorderableColumnIds === undefined) {
            return
          }
          const visibleColumnOrder = table
            .getVisibleLeafColumns()
            .map((column) => column.id)
            .filter((candidateId) => columnReorderIndices.has(candidateId))
          const nextColumnOrder = moveColumnByOffset(
            columnOrder,
            visibleColumnOrder,
            columnId,
            offset,
          )
          if (nextColumnOrder.some((value, index) => value !== columnOrder[index])) {
            table.setColumnOrder(
              mergeReorderableColumnOrder(
                completeColumnOrder,
                reorderableColumnIdSet,
                nextColumnOrder,
              ),
            )
          }
        },
        table,
        setViewportElement,
        viewportElement,
      }) satisfies DataGridContextValue<TData>,
    [
      activeColumnId,
      activeRowId,
      columnReorderEnabled,
      columnReorderIndices,
      columnOrder,
      completeColumnOrder,
      density,
      onCellActivate,
      onCellContextMenu,
      onColumnActivate,
      onHeaderContextMenu,
      onRowActivate,
      onRowContextMenu,
      reorderableColumnIdSet,
      reorderableColumnIds,
      table,
      viewportElement,
    ],
  )

  useEffect(() => {
    onColumnActivateRef.current = onColumnActivate
  }, [onColumnActivate])

  useEffect(() => {
    if (columnReorderConfigured === false || ReorderComponent !== null) {
      return
    }

    let active = true
    void loadDataGridReorder()
      .then((module) => {
        if (active === true) {
          const activeElement = document.activeElement
          if (
            activeElement instanceof Element &&
            rootRef.current?.contains(activeElement) === true
          ) {
            focusedColumnIdRef.current =
              activeElement.closest<HTMLElement>('[data-column-id]')?.dataset.columnId ?? null
          }
          setReorderComponent(() => module.DataGridReorder)
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to load DataGrid reorder behavior', error)
      })

    return () => {
      active = false
    }
  }, [ReorderComponent, columnReorderConfigured])

  useLayoutEffect(() => {
    const focusedColumnId = focusedColumnIdRef.current
    if (ReorderComponent === null || focusedColumnId === null) {
      return
    }
    const focusedCell = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('[data-column-id]') ?? [],
    ).find((cell) => cell.dataset.columnId === focusedColumnId)
    focusedCell?.focus()
    focusedColumnIdRef.current = null
  }, [ReorderComponent])

  useEffect(() => {
    if (activeColumnId === null || onColumnActivateRef.current === undefined) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target) === true) {
        return
      }

      onColumnActivateRef.current?.(null)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onColumnActivateRef.current?.(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeColumnId])

  const root = (
    <DataGridContext.Provider value={value as DataGridContextValue<RowData>}>
      <div
        {...stylex.props(dataGridStyles.root)}
        data-density={density}
        data-slot="data-grid"
        ref={rootRef}
      >
        {children}
      </div>
    </DataGridContext.Provider>
  )

  if (columnReorderEnabled === false || reorderableColumnIds === undefined) {
    return root
  }

  return (
    <ReorderComponent
      columnOrder={columnOrder}
      onColumnOrderChange={(nextColumnOrder) => {
        table.setColumnOrder(
          mergeReorderableColumnOrder(completeColumnOrder, reorderableColumnIdSet, nextColumnOrder),
        )
      }}
      overlayProps={stylex.props(dataGridStyles.columnDragOverlay)}
      rootRef={rootRef}
      renderOverlay={(source) => (
        <div
          {...stylex.props(
            dataGridStyles.headerDragContent,
            dataGridStyles.columnDragOverlayContent,
            density === 'compact' && dataGridStyles.compactCellInlinePadding,
          )}
        >
          {columnDragPreview?.(String(source.id)) ??
            source.element?.textContent ??
            String(source.id)}
        </div>
      )}
    >
      {root}
    </ReorderComponent>
  )
}

function DataGridViewport({ children, scrollResetKey }: DataGridViewportProps) {
  const { density, setViewportElement } = useDataGridContext()
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const registerViewport = useCallback(
    (element: HTMLDivElement | null) => {
      viewportRef.current = element
      setViewportElement(element)
    },
    [setViewportElement],
  )

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (viewport === null) {
      return
    }

    viewport.scrollLeft = 0
    viewport.scrollTop = 0
  }, [scrollResetKey])

  return (
    <ScrollAreaPrivate
      axis="both"
      ref={registerViewport}
      scrollRendering="frequent"
      verticalTrackOffset={density === 'compact' ? 'collection-row-l' : 'collection-row-xl'}
      viewportContainerType="size"
      viewportSlot="data-grid-viewport"
    >
      {children}
    </ScrollAreaPrivate>
  )
}

function DataGridTable({ 'aria-label': ariaLabel, children }: DataGridTableProps) {
  const { table } = useDataGridContext()

  return (
    <Subscribe
      source={table.store}
      selector={(state) => ({
        columnOrder: state.columnOrder,
        columnVisibility: state.columnVisibility,
      })}
    >
      {() => (
        <DataGridTableImplementation aria-label={ariaLabel}>{children}</DataGridTableImplementation>
      )}
    </Subscribe>
  )
}

function DataGridTableImplementation({ 'aria-label': ariaLabel, children }: DataGridTableProps) {
  const { density, table } = useDataGridContext()
  const scrollSurfaceRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const columnGeometry = table
    .getVisibleLeafColumns()
    .map((column) => ({ id: column.id, size: column.getSize() }))
  const tableWidth = columnGeometry.reduce((width, column) => width + column.size, 0)

  useLayoutEffect(() => {
    const writeColumnGeometry = () => {
      const scrollSurface = scrollSurfaceRef.current
      const tableElement = tableRef.current
      if (scrollSurface === null || tableElement === null) {
        return
      }

      const visibleColumns = table.getVisibleLeafColumns()
      const columnElements = tableElement.querySelectorAll<HTMLTableColElement>('col')
      let width = 0
      for (const [index, column] of visibleColumns.entries()) {
        const columnWidth = column.getSize()
        width += columnWidth
        const columnElement = columnElements[index]
        if (columnElement !== undefined) {
          columnElement.style.width = `${columnWidth}px`
        }
      }
      scrollSurface.style.width = `${width}px`
      tableElement.style.width = `${width}px`
    }

    writeColumnGeometry()
    const subscription = table.atoms.columnSizing.subscribe(writeColumnGeometry)
    return () => subscription.unsubscribe()
  }, [table])

  return (
    <div
      {...stylex.props(dataGridStyles.scrollSurface, dataGridStyles.scrollSurfacePaintBoundary)}
      data-slot="data-grid-scroll-surface"
      ref={scrollSurfaceRef}
      style={{ width: tableWidth }}
    >
      <div
        {...stylex.props(dataGridStyles.headerBackdropAnchor)}
        aria-hidden="true"
      >
        <div
          {...stylex.props(
            dataGridStyles.headerBackdrop,
            density === 'compact' && dataGridStyles.compactHeaderBackdrop,
          )}
        />
      </div>
      <table
        {...stylex.props(dataGridStyles.table)}
        aria-label={ariaLabel}
        aria-rowcount={table.getRowModel().rows.length + table.getHeaderGroups().length}
        data-layout="intrinsic"
        data-slot="data-grid-table"
        ref={tableRef}
        style={{ width: tableWidth }}
      >
        <colgroup>
          {columnGeometry.map((column) => (
            <col
              key={column.id}
              style={{ width: column.size }}
            />
          ))}
        </colgroup>
        {children}
      </table>
    </div>
  )
}

function DataGridContent({
  emptyContent = 'No data available',
  loading = false,
  loadingContent = 'Loading data',
  rowRendering = 'all',
}: DataGridContentProps) {
  const { table } = useDataGridContext()

  return (
    <>
      <DataGridHeader />
      {loading === true ? (
        <DataGridLoading>{loadingContent}</DataGridLoading>
      ) : table.getRowModel().rows.length === 0 ? (
        emptyContent === null ? null : (
          <DataGridEmpty>{emptyContent}</DataGridEmpty>
        )
      ) : (
        <DataGridDefaultBody rowRendering={rowRendering} />
      )}
    </>
  )
}

function DataGridHeader({ children }: DataGridHeaderProps) {
  const { table } = useDataGridContext()

  return (
    <thead
      {...stylex.props(dataGridStyles.header)}
      data-slot="data-grid-header"
      data-sticky="true"
    >
      {children ??
        table.getHeaderGroups().map((headerGroup) => (
          <DataGridHeaderRow
            key={headerGroup.id}
            headerGroup={headerGroup}
          />
        ))}
    </thead>
  )
}

function DataGridHeaderRow<TData extends RowData>({
  children,
  headerGroup,
}: DataGridHeaderRowProps<TData>) {
  return (
    <tr data-slot="data-grid-header-row">
      {children ??
        headerGroup.headers.map((header) => (
          <DataGridHeaderCell
            key={header.id}
            header={header}
          />
        ))}
    </tr>
  )
}

function DataGridHeaderCell<TData extends RowData>({
  children,
  header,
}: DataGridHeaderCellProps<TData>) {
  const reorderContext = useDataGridReorderContext()
  const {
    activeColumnId,
    columnReorderEnabled,
    density,
    getColumnReorderIndex,
    moveColumn,
    onColumnActivate,
    onHeaderContextMenu,
    table,
  } = useDataGridContext<TData>()
  const isActive = table.getFocusedCell() === undefined && activeColumnId === header.column.id
  const columnReorderIndex = getColumnReorderIndex(header.column.id)
  const columnReorderable = columnReorderEnabled === true && columnReorderIndex >= 0
  const sortDirection = header.column.getIsSorted()
  const ariaSort =
    header.column.getCanSort() === false
      ? undefined
      : sortDirection === 'asc'
        ? 'ascending'
        : sortDirection === 'desc'
          ? 'descending'
          : 'none'

  const handleClick = (event: MouseEvent<HTMLTableCellElement>) => {
    if (activateSelectionControlFromCell(event) === true) {
      return
    }

    if (isInteractiveTarget(event.target) === false) {
      event.currentTarget.focus()
    }

    onColumnActivate?.(isActive === true ? null : header.column.id)
  }

  const handleContextMenu = (event: MouseEvent<HTMLTableCellElement>) => {
    if (onHeaderContextMenu === undefined) {
      return
    }

    event.preventDefault()
    onHeaderContextMenu(header.column.id, event)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTableCellElement>) => {
    if (
      event.shiftKey === true &&
      event.altKey === false &&
      event.ctrlKey === false &&
      event.metaKey === false &&
      columnReorderable === true &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      event.preventDefault()
      moveColumn(header.column.id, event.key === 'ArrowLeft' ? -1 : 1)
      return
    }

    if (
      event.key === 'Enter' &&
      event.altKey === false &&
      event.ctrlKey === false &&
      event.metaKey === false &&
      event.shiftKey === false &&
      event.target === event.currentTarget &&
      header.column.getCanSort() === true
    ) {
      event.preventDefault()
      header.column.toggleSorting(sortDirection === 'asc')
    }
  }

  const renderHeaderCell = ({
    isDragSource = false,
    isDropping = false,
    setReorderRef,
  }: {
    isDragSource?: boolean
    isDropping?: boolean
    setReorderRef?: (element: HTMLTableCellElement | null) => void
  } = {}) => {
    const isDragVisual = isDragSource === true || isDropping === true

    return (
      <th
        ref={setReorderRef}
        {...stylex.props(
          dataGridStyles.headerCell,
          density === 'compact' && dataGridStyles.compactCell,
          dataGridStyles.headerCellLayout,
          isActive === true && dataGridStyles.headerCellActive,
          columnReorderable === true && dataGridStyles.headerCellReorderable,
          isDragVisual === true && dataGridStyles.headerCellDragging,
        )}
        colSpan={header.colSpan}
        aria-sort={ariaSort}
        data-active={isActive === true ? '' : undefined}
        data-column-id={header.column.id}
        data-dragging={isDragVisual === true ? '' : undefined}
        data-reorderable={columnReorderable === true ? '' : undefined}
        data-slot="data-grid-header-cell"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        scope="col"
        tabIndex={-1}
      >
        <div
          {...stylex.props(
            dataGridStyles.headerDragContent,
            dataGridStyles.headerDragSource,
            density === 'compact' && dataGridStyles.compactCellInlinePadding,
            isDragVisual === true && dataGridStyles.headerDragSourceDragging,
          )}
          aria-hidden={isDragVisual === true ? true : undefined}
          data-slot="data-grid-header-drag-source"
        >
          {header.isPlaceholder === true ? null : (children ?? <FlexRender header={header} />)}
        </div>
        {header.column.getCanResize() === true ? (
          <Subscribe
            source={table.atoms.columnResizing}
            selector={(columnResizing) => columnResizing.isResizingColumn === header.column.id}
          >
            {(isResizing) => (
              <button
                {...stylex.props(
                  dataGridStyles.resizeHandle,
                  isDragVisual === true && dataGridStyles.resizeHandleDragging,
                )}
                aria-label={`Resize ${header.column.id} column`}
                data-resizing={isResizing === true ? '' : undefined}
                data-slot="data-grid-resize-handle"
                onClick={(event) => {
                  event.stopPropagation()
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  header.column.resetSize()
                }}
                onMouseDown={(event) => {
                  event.stopPropagation()
                  header.getResizeHandler()(event)
                }}
                onTouchStart={(event) => {
                  event.stopPropagation()
                  header.getResizeHandler()(event)
                }}
                type="button"
              />
            )}
          </Subscribe>
        ) : null}
      </th>
    )
  }

  const SortableHeader = reorderContext.Header
  if (SortableHeader !== null && columnReorderable === true) {
    return (
      <SortableHeader
        columnId={header.column.id}
        index={columnReorderIndex}
      >
        {renderHeaderCell}
      </SortableHeader>
    )
  }

  return renderHeaderCell()
}

const virtualRowThreshold = 100
const virtualRowOverscan = 48

function DataGridDefaultBody({ rowRendering }: { rowRendering: DataGridRowRendering }) {
  const { table } = useDataGridContext()
  const rows = table.getRowModel().rows

  if (rowRendering === 'virtual' && rows.length > virtualRowThreshold) {
    return <DataGridVirtualBody />
  }

  return <DataGridBody />
}

function DataGridBody({ children }: DataGridBodyProps) {
  const { table } = useDataGridContext()
  const rows = table.getRowModel().rows

  return (
    <tbody data-slot="data-grid-body">
      {children ??
        rows.map((row) => (
          <DataGridRow
            key={row.id}
            row={row}
          />
        ))}
    </tbody>
  )
}

function DataGridVirtualSpacer({ height, slot }: { height: number; slot: string }) {
  const { table } = useDataGridContext()

  if (height <= 0) {
    return null
  }

  return (
    <tr
      aria-hidden="true"
      data-slot={slot}
      role="presentation"
      style={{ height }}
    >
      <td
        {...stylex.props(dataGridStyles.virtualSpacerCell)}
        colSpan={getVisibleColumnCount(table)}
      />
    </tr>
  )
}

/** Keeps native table layout while mounting only the rows intersecting the scroll viewport. */
function DataGridVirtualBody() {
  const { density, table, viewportElement } = useDataGridContext()
  const rows = table.getRowModel().rows
  const getItemKey = useCallback((index: number) => rows[index]?.id ?? index, [rows])
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => (density === 'compact' ? 28 : 32),
    getItemKey,
    getScrollElement: () => viewportElement,
    overscan: virtualRowOverscan,
  })
  const virtualRows = rowVirtualizer.getVirtualItems()
  const firstVirtualRow = virtualRows[0]
  const lastVirtualRow = virtualRows[virtualRows.length - 1]
  const paddingStart = firstVirtualRow?.start ?? 0
  const paddingEnd =
    lastVirtualRow === undefined ? 0 : rowVirtualizer.getTotalSize() - lastVirtualRow.end

  return (
    <tbody
      data-slot="data-grid-body"
      data-row-rendering="virtual"
    >
      <DataGridVirtualSpacer
        height={paddingStart}
        slot="data-grid-virtual-spacer-start"
      />
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index]
        return row === undefined ? null : (
          <DataGridRowImplementation
            key={row.id}
            ariaRowIndex={virtualRow.index + table.getHeaderGroups().length + 1}
            row={row}
          />
        )
      })}
      <DataGridVirtualSpacer
        height={paddingEnd}
        slot="data-grid-virtual-spacer-end"
      />
    </tbody>
  )
}

function DataGridRow<TData extends RowData>(props: DataGridRowProps<TData>) {
  return <DataGridRowImplementation {...props} />
}

function DataGridRowImplementation<TData extends RowData>({
  ariaRowIndex,
  children,
  row,
}: DataGridRowProps<TData> & { ariaRowIndex?: number }) {
  const { activeRowId, onColumnActivate, onRowActivate, onRowContextMenu } =
    useDataGridContext<TData>()
  const isActive = activeRowId === row.id
  const isSelected = row.getIsSelected()

  const handleClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (isInteractiveTarget(event.target) === true) {
      return
    }

    onColumnActivate?.(null)
    onRowActivate?.(row.id)
  }

  const handleContextMenu = (event: MouseEvent<HTMLTableRowElement>) => {
    if (onRowContextMenu === undefined || event.defaultPrevented === true) {
      return
    }

    event.preventDefault()
    onRowContextMenu(row.id, event)
  }

  return (
    <tr
      {...stylex.props(
        dataGridStyles.row,
        isSelected === true && dataGridStyles.rowSelected,
        isActive === true && dataGridStyles.rowActive,
      )}
      aria-selected={isSelected}
      aria-rowindex={ariaRowIndex}
      data-active={isActive === true ? '' : undefined}
      data-selected={isSelected === true ? '' : undefined}
      data-slot="data-grid-row"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {children ??
        row.getVisibleCells().map((cell) => (
          <DataGridCell
            key={cell.id}
            cell={cell}
          />
        ))}
    </tr>
  )
}

function DataGridCell<TData extends RowData>({ children, cell }: DataGridCellProps<TData>) {
  const {
    activeColumnId,
    activeRowId,
    density,
    onCellActivate,
    onCellContextMenu,
    onColumnActivate,
    table,
  } = useDataGridContext<TData>()
  const target = { rowId: cell.row.id, columnId: cell.column.id }
  const isColumnActive = table.getFocusedCell() === undefined && activeColumnId === target.columnId
  const isRowActive = activeRowId === target.rowId
  const isSelected = cell.row.getIsSelected()
  const isCellSelected = cell.getIsSelected()
  const isActive = cell.getIsFocused()

  const handleClick = (event: MouseEvent<HTMLTableCellElement>) => {
    if (event.detail > 1) {
      event.stopPropagation()
      return
    }

    if (activateSelectionControlFromCell(event) === true) {
      return
    }

    if (isInteractiveTarget(event.target) === true) {
      return
    }

    event.stopPropagation()
    event.currentTarget.focus()
    onColumnActivate?.(null)
    onCellActivate?.(target)
  }

  const handleMouseDown = (event: MouseEvent<HTMLTableCellElement>) => {
    if (
      event.defaultPrevented === true ||
      event.button !== 0 ||
      isInteractiveTarget(event.target) === true ||
      isSelectionControlTarget(event.target) === true
    ) {
      return
    }

    cell.getSelectionStartHandler()(event)
  }

  const handleContextMenu = (event: MouseEvent<HTMLTableCellElement>) => {
    if (onCellContextMenu === undefined) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onCellContextMenu(target, event)
  }

  // Body cells intentionally stay outside drag-and-drop registration. Per-cell position observers
  // make header release work scale with the virtual row window, while the header drop can apply
  // TanStack's column order atomically to every rendered cell.
  return (
    <td
      {...stylex.props(
        dataGridStyles.cell,
        density === 'compact' && dataGridStyles.compactCell,
        density === 'compact' && dataGridStyles.compactCellInlinePadding,
        isColumnActive === true && dataGridStyles.cellColumnActive,
        isSelected === true && dataGridStyles.cellSelected,
        isCellSelected === true && dataGridStyles.cellSelection,
        isActive === true && dataGridStyles.cellActive,
      )}
      data-active={isActive === true ? '' : undefined}
      data-cell-selected={isCellSelected === true ? '' : undefined}
      data-column-id={target.columnId}
      data-column-active={isColumnActive === true ? '' : undefined}
      data-row-active={isRowActive === true ? '' : undefined}
      data-selected={isSelected === true ? '' : undefined}
      data-slot="data-grid-cell"
      data-typography="mono"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseEnter={cell.getSelectionExtendHandler()}
      tabIndex={cell.getTabIndex()}
    >
      {children ?? <FlexRender cell={cell} />}
    </td>
  )
}

function DataGridExpandedRow<TData extends RowData>({
  children,
  row,
}: DataGridExpandedRowProps<TData>) {
  return (
    <tr
      data-parent-row-id={row.id}
      data-slot="data-grid-expanded-row"
    >
      <td
        {...stylex.props(dataGridStyles.expandedCell)}
        colSpan={Math.max(row.getVisibleCells().length, 1)}
        data-slot="data-grid-expanded-cell"
      >
        {children}
      </td>
    </tr>
  )
}

function DataGridEmpty({ children }: DataGridMessageProps) {
  const { density, table } = useDataGridContext()

  return (
    <tbody data-slot="data-grid-empty">
      <tr>
        <td
          {...stylex.props(dataGridStyles.messageCell)}
          colSpan={getVisibleColumnCount(table)}
        >
          <div
            {...stylex.props(
              dataGridStyles.messageContent,
              density === 'compact' && dataGridStyles.compactMessageContent,
            )}
            data-slot="data-grid-message-content"
          >
            {children}
          </div>
        </td>
      </tr>
    </tbody>
  )
}

function DataGridLoading({ children }: DataGridMessageProps) {
  const { density, table } = useDataGridContext()

  return (
    <tbody
      aria-busy="true"
      data-slot="data-grid-loading"
    >
      <tr>
        <td
          {...stylex.props(dataGridStyles.messageCell)}
          colSpan={getVisibleColumnCount(table)}
        >
          <div
            {...stylex.props(
              dataGridStyles.messageContent,
              density === 'compact' && dataGridStyles.compactMessageContent,
              dataGridStyles.loadingIndicator,
            )}
            data-slot="data-grid-message-content"
            role="status"
          >
            <Spinner size="s" />
            {children}
          </div>
        </td>
      </tr>
    </tbody>
  )
}

function DataGridFooter({ children }: DataGridFooterProps) {
  return (
    <div
      {...stylex.props(dataGridStyles.footer)}
      data-slot="data-grid-footer"
    >
      {children}
    </div>
  )
}

export const DataGrid = Object.assign(DataGridRoot, {
  Root: DataGridRoot,
  Body: DataGridBody,
  Cell: DataGridCell,
  Content: DataGridContent,
  Empty: DataGridEmpty,
  ExpandedRow: DataGridExpandedRow,
  Footer: DataGridFooter,
  Header: DataGridHeader,
  HeaderCell: DataGridHeaderCell,
  HeaderRow: DataGridHeaderRow,
  Loading: DataGridLoading,
  Row: DataGridRow,
  Table: DataGridTable,
  Viewport: DataGridViewport,
})
