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
  forwardRef,
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type TouchEvent,
} from 'react'

import { ScrollAreaPrivate, type ScrollAreaProps } from '../scrollArea/scrollArea'
import { Spinner } from '../spinner/spinner'
import { dataGridStyles } from './dataGrid.styles'
import { DataGridContext, type DataGridContextValue, useDataGridContext } from './dataGridContext'
import type { DataGridFeatures, DataGridTable } from './dataGridFeatures'
import { useDataGridReorderContext, type DataGridColumnRegion } from './dataGridReorderContext'

export type DataGridDensity = 'compact' | 'default'
export type DataGridRowRendering = 'all' | 'virtual'
export type DataGridRowStatus = 'default' | 'stagedDeletion' | 'recentlyInserted'
export type DataGridCellStatus = 'default' | 'stagedUpdate' | 'recentlyApplied'

const defaultColumnMinSize = 20
const defaultColumnMaxSize = Number.MAX_SAFE_INTEGER
const keyboardColumnResizeStep = 10
const emptyColumnOrder: readonly string[] = []

/**
 * Why: importing DND from this static module pulled the shared sortable chunk into the initial
 * application load. A sibling-runtime alternative kept the chunk deferred but depended on DOM
 * queries, mutation observers, and external element registration.
 *
 * How: the DND implementation loads after mount and wraps the table. Its context supplies small
 * components that attach `useSortable` directly to each owning header ref.
 *
 * What: the first configured grid stays static, then remounts once with reorder behavior. Later
 * grids reuse the loaded component immediately and avoid repeating that remount.
 */
type DataGridReorderModule = typeof import('./dataGridReorder')

let dataGridReorderModule: Promise<DataGridReorderModule> | undefined
let loadedDataGridReorder: DataGridReorderModule['DataGridReorder'] | null = null

function loadDataGridReorder(): Promise<DataGridReorderModule> {
  dataGridReorderModule ??= import('./dataGridReorder')
    .then((module) => {
      loadedDataGridReorder = module.DataGridReorder
      return module
    })
    .catch((error: unknown) => {
      dataGridReorderModule = undefined
      throw error
    })
  return dataGridReorderModule
}

export interface DataGridCellTarget {
  columnId: string
  rowId: string
}

export interface DataGridFocusRequest {
  /** Changes when the same semantic cell must receive focus again. */
  requestId: string | number
  /** Cell that should receive DOM focus when it is available. */
  target: DataGridCellTarget
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
export type DataGridRowContextMenuTouchStartHandler = (
  rowId: string,
  event: TouchEvent<HTMLTableRowElement>,
) => void
export type DataGridCellContextMenuTouchStartHandler = (
  target: DataGridCellTarget,
  event: TouchEvent<HTMLTableCellElement>,
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
  /** Requests semantic body-cell focus, including after virtual remounts. */
  focusRequest?: DataGridFocusRequest | null
  /** Selects a constrained semantic status for each rendered body cell. */
  getCellStatus?: (cell: Cell<DataGridFeatures, TData, unknown>) => DataGridCellStatus
  /** Selects a constrained semantic status for each rendered row. */
  getRowStatus?: (row: Row<DataGridFeatures, TData>) => DataGridRowStatus
  /** Runs when a non-interactive cell is activated. */
  onCellActivate?: (target: DataGridCellTarget) => void
  /** Runs when a non-interactive cell requests editing through double-click or Enter. */
  onCellEditRequest?: (target: DataGridCellTarget) => void
  /** Runs when a cell context menu is requested. */
  onCellContextMenu?: DataGridCellContextMenuHandler
  /** Records the semantic cell targeted by a possible touch context-menu gesture. */
  onCellContextMenuTouchStart?: DataGridCellContextMenuTouchStartHandler
  /** Runs when a column header is activated. */
  onColumnActivate?: (columnId: string | null) => void
  /** Runs when a column-header context menu is requested. */
  onHeaderContextMenu?: DataGridHeaderContextMenuHandler
  /** Runs when a non-interactive row is activated. */
  onRowActivate?: (rowId: string) => void
  /** Runs when a row context menu is requested. */
  onRowContextMenu?: DataGridRowContextMenuHandler
  /** Records the semantic row targeted by a possible touch context-menu gesture. */
  onRowContextMenuTouchStart?: DataGridRowContextMenuTouchStartHandler
  /** Controlled TanStack table instance rendered by the compound parts. */
  table: DataGridTable<TData>
}

interface ReorderableDataGridRootProps {
  /** Renders the inert visual shown while a column header is dragged. */
  columnDragPreview?: (columnId: string) => ReactNode
  /** Leaf column ids that can be reordered within their current TanStack pin region. */
  reorderableColumnIds: readonly string[]
}

interface StaticDataGridRootProps {
  columnDragPreview?: never
  reorderableColumnIds?: never
}

export type DataGridRootProps<TData extends RowData> = DataGridRootBaseProps<TData> &
  (ReorderableDataGridRootProps | StaticDataGridRootProps)

export interface DataGridViewportProps extends Omit<
  ScrollAreaProps,
  'axis' | 'children' | 'tabIndex'
> {
  /** Table or custom viewport content. */
  children: ReactNode
  /** Changing this value resets both scroll axes without remounting the viewport content. */
  scrollResetKey?: string | number
}

export interface DataGridTableProps {
  /** Whether the table is updating while its settled rows remain available. */
  'aria-busy'?: boolean
  /** Accessible name for the table. */
  'aria-label': string
  /** Header and body composition. */
  children: ReactNode
  /** Polite announcement rendered in a stable, visually hidden status region. */
  statusContent?: ReactNode
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

function isElementTarget(target: EventTarget | null | undefined): target is Element {
  return typeof (target as Element | null)?.closest === 'function'
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (isElementTarget(target) === false) {
    return false
  }

  return (
    target.closest(
      'a, button, input, select, textarea, [contenteditable="true"], [role="button"], [role="checkbox"], [role="combobox"], [role="link"], [role="menuitem"], [role="option"], [role="radio"], [role="switch"], [role="textbox"]',
    ) !== null
  )
}

function isSelectionControlTarget(target: EventTarget | null): boolean {
  if (isElementTarget(target) === false) {
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
    const MouseEventConstructor = event.currentTarget.ownerDocument.defaultView?.MouseEvent
    if (MouseEventConstructor !== undefined) {
      selectionControl.dispatchEvent(
        new MouseEventConstructor('click', {
          bubbles: true,
          cancelable: true,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
        }),
      )
    }
  }
  return true
}

function getVisibleColumnCount<TData extends RowData>(table: DataGridTable<TData>): number {
  return Math.max(table.getVisibleLeafColumns().length, 1)
}

function getFirstSelectableCell<TData extends RowData>(
  table: DataGridTable<TData>,
): Cell<DataGridFeatures, TData, unknown> | undefined {
  for (const row of table.getRowModel().rows) {
    for (const cell of row.getVisibleCells()) {
      if (cell.getCanSelect() === true) {
        return cell
      }
    }
  }
}

function getCellSelectionRowRenderState<TData extends RowData>(
  table: DataGridTable<TData>,
  row: Row<DataGridFeatures, TData>,
  firstSelectableCell: Cell<DataGridFeatures, TData, unknown> | undefined,
) {
  const rows = table.getRowModel().rows
  const rowIndex = row.getDisplayIndex()
  const focusedCell = table.getFocusedCell()
  const entryCell = focusedCell ?? firstSelectableCell
  const selectedCells = rows
    .slice(Math.max(rowIndex - 1, 0), rowIndex + 2)
    .flatMap((candidateRow) => candidateRow.getVisibleCells())
    .map((cell) => (cell.getIsSelected() === true ? '1' : '0'))
    .join('|')

  return {
    entryCellId: entryCell?.row.id === row.id ? entryCell.id : null,
    hasMultiCellSelection: focusedCell?.row.id === row.id && table.getSelectedCellCount() > 1,
    selectedCells,
  }
}

function moveColumnByOffset(
  columnOrder: readonly string[],
  visibleColumnOrder: readonly string[],
  columnId: string,
  offset: -1 | 1,
): string[] {
  const visibleIndex = visibleColumnOrder.indexOf(columnId)
  const nextVisibleIndex = visibleIndex + offset
  if (
    columnOrder.includes(columnId) === false ||
    visibleIndex < 0 ||
    nextVisibleIndex < 0 ||
    nextVisibleIndex >= visibleColumnOrder.length
  ) {
    return [...columnOrder]
  }
  const nextVisibleColumnOrder = [...visibleColumnOrder]
  const [column] = nextVisibleColumnOrder.splice(visibleIndex, 1)
  if (column !== undefined) {
    nextVisibleColumnOrder.splice(nextVisibleIndex, 0, column)
  }
  return mergeReorderableColumnOrder(
    columnOrder,
    new Set(visibleColumnOrder),
    nextVisibleColumnOrder,
  )
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

function normalizeCompleteColumnOrder(
  configuredColumnOrder: readonly string[],
  definedColumnOrder: readonly string[],
): string[] {
  const definedColumnIds = new Set(definedColumnOrder)
  const includedColumnIds = new Set<string>()
  const completeColumnOrder: string[] = []

  for (const columnId of configuredColumnOrder) {
    if (definedColumnIds.has(columnId) === true && includedColumnIds.has(columnId) === false) {
      includedColumnIds.add(columnId)
      completeColumnOrder.push(columnId)
    }
  }
  for (const columnId of definedColumnOrder) {
    if (includedColumnIds.has(columnId) === false) {
      includedColumnIds.add(columnId)
      completeColumnOrder.push(columnId)
    }
  }
  return completeColumnOrder
}

function getColumnRegion(pinnedPosition: false | 'end' | 'start'): DataGridColumnRegion {
  return pinnedPosition === false ? 'center' : pinnedPosition
}

function DataGridRoot<TData extends RowData>(props: DataGridRootProps<TData>) {
  return (
    <Subscribe
      source={props.table.store}
      selector={(state) => ({
        columnOrder: state.columnOrder,
        columnPinning: state.columnPinning,
        columnVisibility: state.columnVisibility,
      })}
    >
      {() => <DataGridRootImplementation {...props} />}
    </Subscribe>
  )
}

function DataGridRootImplementation<TData extends RowData>({
  activeColumnId = null,
  activeRowId = null,
  children,
  columnDragPreview,
  density = 'default',
  focusRequest = null,
  getCellStatus,
  getRowStatus,
  onCellActivate,
  onCellEditRequest,
  onCellContextMenu,
  onCellContextMenuTouchStart,
  onColumnActivate,
  onHeaderContextMenu,
  onRowActivate,
  onRowContextMenu,
  onRowContextMenuTouchStart,
  reorderableColumnIds,
  table,
}: DataGridRootProps<TData>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cellElementsRef = useRef(new Map<string, HTMLTableCellElement>())
  const shouldFocusFocusedCellRef = useRef(false)
  const processedFocusRequestRef = useRef<DataGridFocusRequest | null>(null)
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null)
  const focusedColumnIdRef = useRef<string | null>(null)
  const [ReorderComponent, setReorderComponent] = useState<
    DataGridReorderModule['DataGridReorder'] | null
  >(() => loadedDataGridReorder)
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
  const definedColumns = table.getAllLeafColumns()
  const definedColumnOrder = useMemo(
    () => definedColumns.map((column) => column.id),
    [definedColumns],
  )
  const tableState = table.store.state
  const completeColumnOrder = useMemo(
    () => normalizeCompleteColumnOrder(tableState.columnOrder, definedColumnOrder),
    [definedColumnOrder, tableState.columnOrder],
  )
  const pinnedStartColumnOrder = tableState.columnPinning?.start ?? emptyColumnOrder
  const pinnedEndColumnOrder = tableState.columnPinning?.end ?? emptyColumnOrder
  const completeColumnOrders = useMemo<Record<DataGridColumnRegion, readonly string[]>>(() => {
    const pinnedColumnIds = new Set([...pinnedStartColumnOrder, ...pinnedEndColumnOrder])
    return {
      start: pinnedStartColumnOrder,
      center: completeColumnOrder.filter((columnId) => pinnedColumnIds.has(columnId) === false),
      end: pinnedEndColumnOrder,
    }
  }, [completeColumnOrder, pinnedEndColumnOrder, pinnedStartColumnOrder])
  const visibleReorderableColumnOrders = useMemo<
    Record<DataGridColumnRegion, readonly string[]>
  >(() => {
    const isVisibleReorderableColumn = (columnId: string) =>
      reorderableColumnIdSet.has(columnId) === true &&
      tableState.columnVisibility?.[columnId] !== false
    return {
      start: completeColumnOrders.start.filter(isVisibleReorderableColumn),
      center: completeColumnOrders.center.filter(isVisibleReorderableColumn),
      end: completeColumnOrders.end.filter(isVisibleReorderableColumn),
    }
  }, [completeColumnOrders, reorderableColumnIdSet, tableState.columnVisibility])
  const columnReorderIndices = useMemo(
    () =>
      new Map(
        (['start', 'center', 'end'] as const).flatMap((region) =>
          visibleReorderableColumnOrders[region].map(
            (columnId, index) => [columnId, index] as const,
          ),
        ),
      ),
    [visibleReorderableColumnOrders],
  )

  const columnReorderConfigured = reorderableColumnIds !== undefined
  const columnReorderEnabled = columnReorderConfigured === true && ReorderComponent !== null
  const firstSelectableCell = getFirstSelectableCell(table)
  const canClearActiveColumn = onColumnActivate !== undefined
  const clearActiveColumn = useEffectEvent(() => {
    onColumnActivate?.(null)
  })
  const focusFocusedCell = useCallback(() => {
    shouldFocusFocusedCellRef.current = true
    queueMicrotask(() => {
      const focusedCell = table.getFocusedCell()
      const focusedCellElement =
        focusedCell === undefined ? undefined : cellElementsRef.current.get(focusedCell.id)
      if (focusedCellElement !== undefined) {
        focusedCellElement.focus()
        shouldFocusFocusedCellRef.current = false
      }
    })
  }, [table])
  const registerCellElement = useCallback(
    (cellId: string, element: HTMLTableCellElement | null) => {
      if (element === null) {
        cellElementsRef.current.delete(cellId)
      } else {
        cellElementsRef.current.set(cellId, element)
        if (shouldFocusFocusedCellRef.current === true && table.getFocusedCell()?.id === cellId) {
          element.focus()
          shouldFocusFocusedCellRef.current = false
        }
      }
    },
    [table],
  )
  const value = useMemo(
    () =>
      ({
        activeColumnId,
        activeRowId,
        density,
        onCellActivate,
        onCellEditRequest,
        onCellContextMenu,
        onCellContextMenuTouchStart,
        onColumnActivate,
        onHeaderContextMenu,
        onRowActivate,
        onRowContextMenu,
        onRowContextMenuTouchStart,
        columnReorderEnabled,
        firstSelectableCell,
        focusFocusedCell,
        getCellStatus,
        getRowStatus,
        getColumnReorderIndex: (columnId: string) => columnReorderIndices.get(columnId) ?? -1,
        moveColumn: (columnId: string, offset: -1 | 1) => {
          if (reorderableColumnIds === undefined) {
            return
          }
          const column = table.getColumn(columnId)
          if (column === undefined) {
            return
          }
          const region = getColumnRegion(column.getIsPinned())
          const visibleColumnOrder = visibleReorderableColumnOrders[region]
          const completeRegionColumnOrder =
            region === 'center' ? completeColumnOrder : completeColumnOrders[region]
          const nextColumnOrder = moveColumnByOffset(
            completeRegionColumnOrder,
            visibleColumnOrder,
            columnId,
            offset,
          )
          if (nextColumnOrder.some((value, index) => value !== completeRegionColumnOrder[index])) {
            if (region === 'center') {
              table.setColumnOrder(nextColumnOrder)
            } else {
              table.setColumnPinning((currentColumnPinning) => ({
                ...currentColumnPinning,
                [region]: nextColumnOrder,
              }))
            }
          }
        },
        registerCellElement,
        table,
        setViewportElement,
        viewportElement,
      }) satisfies DataGridContextValue<TData>,
    [
      activeColumnId,
      activeRowId,
      columnReorderEnabled,
      columnReorderIndices,
      completeColumnOrders,
      completeColumnOrder,
      density,
      firstSelectableCell,
      focusFocusedCell,
      getCellStatus,
      getRowStatus,
      onCellActivate,
      onCellEditRequest,
      onCellContextMenu,
      onCellContextMenuTouchStart,
      onColumnActivate,
      onHeaderContextMenu,
      onRowActivate,
      onRowContextMenu,
      onRowContextMenuTouchStart,
      reorderableColumnIds,
      registerCellElement,
      table,
      visibleReorderableColumnOrders,
      viewportElement,
    ],
  )

  useLayoutEffect(() => {
    if (shouldFocusFocusedCellRef.current === false) {
      return
    }

    const focusedCell = table.getFocusedCell()
    if (focusedCell === undefined) {
      shouldFocusFocusedCellRef.current = false
      return
    }
    const focusedCellElement = cellElementsRef.current.get(focusedCell.id)
    if (focusedCellElement !== undefined) {
      focusedCellElement.focus()
      shouldFocusFocusedCellRef.current = false
    }
  })

  useEffect(() => {
    if (focusRequest === null) {
      return
    }
    const processedFocusRequest = processedFocusRequestRef.current
    if (
      processedFocusRequest?.requestId === focusRequest.requestId &&
      processedFocusRequest.target.rowId === focusRequest.target.rowId &&
      processedFocusRequest.target.columnId === focusRequest.target.columnId
    ) {
      return
    }
    const requestedCell = table
      .getRowModel()
      .rows.find((row) => row.id === focusRequest.target.rowId)
      ?.getVisibleCells()
      .find((cell) => cell.column.id === focusRequest.target.columnId)
    if (requestedCell === undefined) {
      return
    }

    processedFocusRequestRef.current = focusRequest
    table.setFocusedCell(focusRequest.target.rowId, focusRequest.target.columnId)
    focusFocusedCell()
  }, [focusFocusedCell, focusRequest, table])

  useEffect(() => {
    if (columnReorderConfigured === false || ReorderComponent !== null) {
      return
    }

    let active = true
    void loadDataGridReorder()
      .then((module) => {
        if (active === true) {
          const activeElement = rootRef.current?.ownerDocument.activeElement
          if (
            isElementTarget(activeElement) === true &&
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
    if (activeColumnId === null || canClearActiveColumn === false) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        typeof (event.target as Node | null)?.nodeType === 'number' &&
        rootRef.current?.contains(event.target as Node) === true
      ) {
        return
      }

      clearActiveColumn()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearActiveColumn()
      }
    }

    const ownerDocument = rootRef.current?.ownerDocument
    if (ownerDocument === undefined) {
      return
    }
    ownerDocument.addEventListener('pointerdown', handlePointerDown)
    ownerDocument.addEventListener('keydown', handleKeyDown)

    return () => {
      ownerDocument.removeEventListener('pointerdown', handlePointerDown)
      ownerDocument.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeColumnId, canClearActiveColumn])

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

  if (columnReorderEnabled === false) {
    return root
  }

  return (
    <ReorderComponent
      columnOrders={visibleReorderableColumnOrders}
      onColumnOrderChange={(region, nextColumnOrder) => {
        const visibleRegionReorderableColumnIds = new Set(visibleReorderableColumnOrders[region])
        if (region === 'center') {
          table.setColumnOrder(
            mergeReorderableColumnOrder(
              completeColumnOrder,
              visibleRegionReorderableColumnIds,
              nextColumnOrder,
            ),
          )
          return
        }
        table.setColumnPinning((currentColumnPinning) => ({
          ...currentColumnPinning,
          [region]: mergeReorderableColumnOrder(
            completeColumnOrders[region],
            visibleRegionReorderableColumnIds,
            nextColumnOrder,
          ),
        }))
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

const DataGridViewport = forwardRef<HTMLDivElement, DataGridViewportProps>(
  function DataGridViewport({ children, scrollResetKey, ...props }, forwardedRef) {
    const { density, setViewportElement } = useDataGridContext()
    const viewportRef = useRef<HTMLDivElement | null>(null)
    const registerViewport = useCallback(
      (element: HTMLDivElement | null) => {
        viewportRef.current = element
        setViewportElement(element)
        if (typeof forwardedRef === 'function') {
          forwardedRef(element)
        } else if (forwardedRef !== null) {
          forwardedRef.current = element
        }
      },
      [forwardedRef, setViewportElement],
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
        {...props}
        axis="both"
        overscrollBehavior="none"
        ref={registerViewport}
        scrollRendering="frequent"
        tabIndex={-1}
        verticalTrackOffset={density === 'compact' ? 'collection-row-l' : 'collection-row-xl'}
        viewportContainerType="size"
        viewportSlot="data-grid-viewport"
      >
        {children}
      </ScrollAreaPrivate>
    )
  },
)

function DataGridTable(props: DataGridTableProps) {
  const { table } = useDataGridContext()

  return (
    <Subscribe
      source={table.store}
      selector={(state) => ({
        columnOrder: state.columnOrder,
        columnPinning: state.columnPinning,
        columnVisibility: state.columnVisibility,
      })}
    >
      {() => <DataGridTableImplementation {...props} />}
    </Subscribe>
  )
}

function getVisibleDataGridColumns<TData extends RowData>(table: DataGridTable<TData>) {
  return [
    ...table.getStartVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getEndVisibleLeafColumns(),
  ]
}

function DataGridTableImplementation({
  'aria-busy': ariaBusy,
  'aria-label': ariaLabel,
  children,
  statusContent,
}: DataGridTableProps) {
  const { density, table } = useDataGridContext()
  const scrollSurfaceRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const columnGeometry = getVisibleDataGridColumns(table).map((column) => ({
    id: column.id,
    size: column.getSize(),
  }))
  const tableWidth = columnGeometry.reduce((width, column) => width + column.size, 0)

  useLayoutEffect(() => {
    const writeColumnGeometry = () => {
      const scrollSurface = scrollSurfaceRef.current
      const tableElement = tableRef.current
      if (scrollSurface === null || tableElement === null) {
        return
      }

      const visibleColumns = getVisibleDataGridColumns(table)
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
      for (const pinnedElement of tableElement.querySelectorAll<HTMLElement>(
        '[data-pinned][data-column-id]',
      )) {
        const columnId = pinnedElement.dataset.columnId
        const column = columnId === undefined ? undefined : table.getColumn(columnId)
        if (column !== undefined && pinnedElement.dataset.pinned === 'start') {
          pinnedElement.style.insetInlineStart = `${column.getStart('start')}px`
        } else if (column !== undefined && pinnedElement.dataset.pinned === 'end') {
          pinnedElement.style.insetInlineEnd = `${column.getAfter('end')}px`
        }
      }
    }

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
        {...stylex.props(dataGridStyles.visuallyHidden)}
        aria-atomic="true"
        aria-live="polite"
        data-slot="data-grid-status"
        role="status"
      >
        {statusContent}
      </div>
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
        aria-busy={ariaBusy === true ? true : undefined}
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

function DataGridHeaderCell<TData extends RowData>(props: DataGridHeaderCellProps<TData>) {
  const { table } = useDataGridContext<TData>()

  return (
    <Subscribe
      source={table.atoms.cellSelection}
      selector={() => table.getFocusedCell() === undefined}
    >
      {() => <DataGridHeaderCellImplementation {...props} />}
    </Subscribe>
  )
}

function DataGridHeaderCellImplementation<TData extends RowData>({
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
  const minSize = header.column.columnDef.minSize ?? defaultColumnMinSize
  const maxSize = header.column.columnDef.maxSize ?? defaultColumnMaxSize
  const columnReorderIndex = getColumnReorderIndex(header.column.id)
  const columnReorderable = columnReorderEnabled === true && columnReorderIndex >= 0
  const sortDirection = header.column.getIsSorted()
  const pinnedPosition = header.column.getIsPinned()
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
      event.target === event.currentTarget &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      event.preventDefault()
      moveColumn(header.column.id, event.key === 'ArrowLeft' ? -1 : 1)
      return
    }

    if (
      event.altKey === false &&
      event.ctrlKey === false &&
      event.metaKey === false &&
      event.shiftKey === false &&
      event.target === event.currentTarget
    ) {
      if (event.key === ' ' && onColumnActivate !== undefined) {
        event.preventDefault()
        onColumnActivate(isActive === true ? null : header.column.id)
        return
      }

      if (event.key === 'Enter' && header.column.getCanSort() === true) {
        event.preventDefault()
        header.column.toggleSorting(sortDirection === 'asc')
      }
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
          dataGridStyles.focusTarget,
          density === 'compact' && dataGridStyles.compactCell,
          dataGridStyles.headerCellLayout,
          isActive === true && dataGridStyles.activeTarget,
          isActive === true && dataGridStyles.headerCellActive,
          pinnedPosition !== false && dataGridStyles.pinnedHeaderCell,
          columnReorderable === true && dataGridStyles.headerCellReorderable,
          isDragVisual === true && dataGridStyles.headerCellDragging,
        )}
        colSpan={header.colSpan}
        aria-label={
          typeof header.column.columnDef.header === 'string'
            ? header.column.columnDef.header
            : undefined
        }
        aria-sort={ariaSort}
        data-active={isActive === true ? '' : undefined}
        data-column-id={header.column.id}
        data-dragging={isDragVisual === true ? '' : undefined}
        data-pinned={pinnedPosition === false ? undefined : pinnedPosition}
        data-reorderable={columnReorderable === true ? '' : undefined}
        data-slot="data-grid-header-cell"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        scope="col"
        style={
          pinnedPosition === 'start'
            ? { insetInlineStart: `${header.column.getStart('start')}px` }
            : pinnedPosition === 'end'
              ? { insetInlineEnd: `${header.column.getAfter('end')}px` }
              : undefined
        }
        tabIndex={
          header.column.getCanSort() === true ||
          columnReorderable === true ||
          onColumnActivate !== undefined
            ? 0
            : -1
        }
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
          {header.isPlaceholder === true ? null : (
            <Subscribe source={table.atoms.rowSelection}>
              {() => children ?? <FlexRender header={header} />}
            </Subscribe>
          )}
        </div>
        {header.column.getCanResize() === true ? (
          <Subscribe
            source={table.store}
            selector={(state) => ({
              columnSize: state.columnSizing[header.column.id],
              isResizing: state.columnResizing.isResizingColumn === header.column.id,
            })}
          >
            {({ isResizing }) => (
              <button
                {...stylex.props(
                  dataGridStyles.resizeHandle,
                  isDragVisual === true && dataGridStyles.resizeHandleDragging,
                )}
                aria-label={`Resize ${header.column.id} column`}
                aria-orientation="vertical"
                aria-valuemax={maxSize}
                aria-valuemin={minSize}
                aria-valuenow={header.column.getSize()}
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
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    event.stopPropagation()
                    header.column.resetSize()
                    return
                  }
                  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                    return
                  }

                  event.preventDefault()
                  event.stopPropagation()
                  const direction = table.options.columnResizeDirection ?? 'ltr'
                  const logicalOffset = event.key === 'ArrowRight' ? 1 : -1
                  const offset = direction === 'rtl' ? -logicalOffset : logicalOffset
                  const size = Math.min(
                    Math.max(header.column.getSize() + offset * keyboardColumnResizeStep, minSize),
                    maxSize,
                  )
                  table.setColumnSizing((columnSizing) => ({
                    ...columnSizing,
                    [header.column.id]: size,
                  }))
                }}
                onTouchStart={(event) => {
                  event.stopPropagation()
                  header.getResizeHandler()(event)
                }}
                role="separator"
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
        region={getColumnRegion(pinnedPosition)}
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
  const { activeRowId, table } = useDataGridContext()
  const rows = table.getRowModel().rows
  const scrollActiveRowIntoView = useCallback((row: HTMLTableRowElement | null) => {
    row?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [])

  return (
    <tbody data-slot="data-grid-body">
      {children ??
        rows.map((row) => (
          <DataGridSubscribedRow
            key={row.id}
            rowRef={row.id === activeRowId ? scrollActiveRowIntoView : undefined}
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
  const { table } = useDataGridContext()

  return (
    <Subscribe
      source={table.atoms.cellSelection}
      selector={() => table.getFocusedCell()?.row.id ?? null}
    >
      {() => <DataGridVirtualBodyImplementation />}
    </Subscribe>
  )
}

function DataGridVirtualBodyImplementation() {
  const { activeRowId, density, table, viewportElement } = useDataGridContext()
  const rows = table.getRowModel().rows
  const rowHeight = density === 'compact' ? 28 : 32
  const getItemKey = useCallback((index: number) => rows[index]?.id ?? index, [rows])
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    getItemKey,
    getScrollElement: () => viewportElement,
    overscan: virtualRowOverscan,
    scrollPaddingEnd: rowHeight * 2,
    scrollPaddingStart: rowHeight * 2,
  })
  const virtualRows = rowVirtualizer.getVirtualItems()
  const firstVirtualRow = virtualRows[0]
  const lastVirtualRow = virtualRows[virtualRows.length - 1]
  const paddingStart = firstVirtualRow?.start ?? 0
  const paddingEnd =
    lastVirtualRow === undefined ? 0 : rowVirtualizer.getTotalSize() - lastVirtualRow.end
  const activeRowIndex = rows.findIndex((row) => row.id === activeRowId)
  const focusedRowId = table.getFocusedCell()?.row.id
  const focusedRowIndex = rows.findIndex((row) => row.id === focusedRowId)

  useLayoutEffect(() => {
    if (activeRowIndex >= 0) {
      rowVirtualizer.scrollToIndex(activeRowIndex, { align: 'auto' })
    }
  }, [activeRowIndex, rowVirtualizer])

  useLayoutEffect(() => {
    if (focusedRowIndex >= 0) {
      rowVirtualizer.scrollToIndex(focusedRowIndex, { align: 'auto' })
    }
  }, [focusedRowIndex, rowVirtualizer])

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
          <DataGridSubscribedRow
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
  return <DataGridSubscribedRow {...props} />
}

function DataGridSubscribedRow<TData extends RowData>(
  props: DataGridRowProps<TData> & { ariaRowIndex?: number; rowRef?: Ref<HTMLTableRowElement> },
) {
  const { firstSelectableCell, table } = useDataGridContext<TData>()

  return (
    <Subscribe
      source={table.atoms.rowSelection}
      selector={(rowSelection) => rowSelection[props.row.id] === true}
    >
      {() => (
        <Subscribe
          source={table.atoms.cellSelection}
          selector={() => getCellSelectionRowRenderState(table, props.row, firstSelectableCell)}
        >
          {() => <DataGridRowImplementation {...props} />}
        </Subscribe>
      )}
    </Subscribe>
  )
}

function DataGridRowImplementation<TData extends RowData>({
  ariaRowIndex,
  children,
  row,
  rowRef,
}: DataGridRowProps<TData> & {
  ariaRowIndex?: number
  rowRef?: Ref<HTMLTableRowElement>
}) {
  const {
    activeRowId,
    density,
    getRowStatus,
    onCellContextMenu,
    onCellContextMenuTouchStart,
    onColumnActivate,
    onRowActivate,
    onRowContextMenu,
    onRowContextMenuTouchStart,
  } = useDataGridContext<TData>()
  const isActive = activeRowId === row.id
  const isSelected = row.getIsSelected()
  const status = getRowStatus?.(row) ?? 'default'

  const handleClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (isInteractiveTarget(event.target) === true) {
      return
    }

    onColumnActivate?.(null)
    onRowActivate?.(row.id)
  }

  const handleContextMenu = (event: MouseEvent<HTMLTableRowElement>) => {
    if (
      onRowContextMenu === undefined ||
      event.defaultPrevented === true ||
      (onCellContextMenu !== undefined &&
        isElementTarget(event.target) === true &&
        event.target.closest('[data-slot="data-grid-cell"]') !== null)
    ) {
      return
    }

    event.preventDefault()
    onRowContextMenu(row.id, event)
  }

  const handleTouchStart = (event: TouchEvent<HTMLTableRowElement>) => {
    if (
      onRowContextMenuTouchStart === undefined ||
      (onCellContextMenuTouchStart !== undefined &&
        isElementTarget(event.target) === true &&
        event.target.closest('[data-slot="data-grid-cell"]') !== null)
    ) {
      return
    }
    onRowContextMenuTouchStart(row.id, event)
  }

  return (
    <tr
      ref={rowRef}
      {...stylex.props(
        dataGridStyles.row,
        isActive === true && dataGridStyles.rowScrollTarget,
        isActive === true && density === 'compact' && dataGridStyles.compactRowScrollTarget,
        isSelected === true && dataGridStyles.rowSelected,
        status === 'stagedDeletion' && dataGridStyles.rowStagedDeletion,
        status === 'recentlyInserted' &&
          isSelected === false &&
          isActive === false &&
          dataGridStyles.rowRecentlyInserted,
      )}
      aria-selected={isSelected}
      aria-rowindex={ariaRowIndex}
      data-active={isActive === true ? '' : undefined}
      data-selected={isSelected === true ? '' : undefined}
      data-status={status}
      data-slot="data-grid-row"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
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
    firstSelectableCell,
    focusFocusedCell,
    getCellStatus,
    getRowStatus,
    onCellActivate,
    onCellEditRequest,
    onCellContextMenu,
    onCellContextMenuTouchStart,
    onColumnActivate,
    onRowActivate,
    registerCellElement,
    table,
  } = useDataGridContext<TData>()
  const target = { rowId: cell.row.id, columnId: cell.column.id }
  const isColumnActive =
    activeColumnId === target.columnId &&
    table.getFocusedCell() === undefined &&
    cell.getCanSelect() === true
  const isRowActive = activeRowId === target.rowId
  const isSelected = cell.row.getIsSelected()
  const pinnedPosition = cell.column.getIsPinned()
  const isFirstVisibleCell = cell.row.getVisibleCells()[0]?.id === cell.id
  const isCellSelected = cell.getIsSelected()
  const selectionEdges = isCellSelected === true ? cell.getSelectionEdges() : undefined
  const isActive = cell.getIsFocused()
  const rowStatus = getRowStatus?.(cell.row) ?? 'default'
  const status = rowStatus === 'stagedDeletion' ? 'default' : (getCellStatus?.(cell) ?? 'default')
  const showPinnedRecentlyInserted =
    pinnedPosition !== false &&
    rowStatus === 'recentlyInserted' &&
    isSelected === false &&
    isRowActive === false &&
    isColumnActive === false &&
    isCellSelected === false &&
    isActive === false &&
    status === 'default'
  const hasMultiCellSelection = table.getSelectedCellCount() > 1
  const bodyCellEntryId = table.getFocusedCell()?.id ?? firstSelectableCell?.id ?? null
  const tabIndex = cell.getTabIndex() === 0 || bodyCellEntryId === cell.id ? 0 : -1
  const registerCell = useCallback(
    (element: HTMLTableCellElement | null) => {
      registerCellElement(cell.id, element)
    },
    [cell.id, registerCellElement],
  )
  const activateCell = () => {
    onColumnActivate?.(null)
    if (onCellActivate === undefined) {
      onRowActivate?.(target.rowId)
    } else {
      onCellActivate(target)
    }
  }

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
    activateCell()
  }

  const handleMouseDown = (event: MouseEvent<HTMLTableCellElement>) => {
    if (
      event.defaultPrevented === true ||
      event.button !== 0 ||
      isInteractiveTarget(event.target) === true
    ) {
      return
    }

    cell.getSelectionStartHandler(event.currentTarget.ownerDocument)(event)
  }

  const handleContextMenu = (event: MouseEvent<HTMLTableCellElement>) => {
    if (onCellContextMenu === undefined) {
      return
    }

    event.preventDefault()
    if (cell.getCanSelect() === true && cell.getIsSelected() === false) {
      table.selectCellRange({
        anchorRowId: target.rowId,
        anchorColumnId: target.columnId,
        focusRowId: target.rowId,
        focusColumnId: target.columnId,
      })
      event.currentTarget.focus()
    }
    onCellContextMenu(target, event)
  }

  const handleTouchStart = (event: TouchEvent<HTMLTableCellElement>) => {
    onCellContextMenuTouchStart?.(target, event)
  }

  const handleDoubleClick = (event: MouseEvent<HTMLTableCellElement>) => {
    if (event.button !== 0 || isInteractiveTarget(event.target) === true) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.focus()
    onColumnActivate?.(null)
    onCellEditRequest?.(target)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTableCellElement>) => {
    if (
      event.target !== event.currentTarget ||
      event.altKey === true ||
      event.ctrlKey === true ||
      event.metaKey === true ||
      event.shiftKey === true
    ) {
      return
    }

    const directions = {
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
    } as const
    if (event.key in directions) {
      event.preventDefault()
      table.moveCellSelection(directions[event.key as keyof typeof directions])
      focusFocusedCell()
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (onCellEditRequest !== undefined) {
        onColumnActivate?.(null)
        onCellEditRequest(target)
      } else {
        activateCell()
      }
      return
    }
    if (event.key === ' ') {
      event.preventDefault()
      activateCell()
    }
  }

  // Body cells intentionally stay outside drag-and-drop registration. Per-cell position observers
  // make header release work scale with the virtual row window, while the header drop can apply
  // TanStack's column order atomically to every rendered cell.
  return (
    <td
      {...stylex.props(
        dataGridStyles.cell,
        dataGridStyles.focusTarget,
        density === 'compact' && dataGridStyles.compactCell,
        density === 'compact' && dataGridStyles.compactCellInlinePadding,
        pinnedPosition !== false && dataGridStyles.pinnedCellSurface,
        pinnedPosition !== false &&
          rowStatus === 'stagedDeletion' &&
          dataGridStyles.pinnedCellStagedDeletion,
        showPinnedRecentlyInserted === true && dataGridStyles.pinnedCellRecentlyInserted,
        isColumnActive === true && dataGridStyles.cellColumnActive,
        isSelected === true && dataGridStyles.cellSelected,
        isSelected === true &&
          rowStatus !== 'stagedDeletion' &&
          isFirstVisibleCell === true &&
          dataGridStyles.cellSelectedMarker,
        isCellSelected === true && dataGridStyles.cellSelection,
        selectionEdges?.top === true && dataGridStyles.cellSelectionEdgeTop,
        selectionEdges?.right === true && dataGridStyles.cellSelectionEdgeRight,
        selectionEdges?.bottom === true && dataGridStyles.cellSelectionEdgeBottom,
        selectionEdges?.left === true && dataGridStyles.cellSelectionEdgeLeft,
        isActive === true && hasMultiCellSelection === true && dataGridStyles.cellDragOrigin,
        isActive === true &&
          (isCellSelected === true ? dataGridStyles.cellActiveSelected : dataGridStyles.cellActive),
        status === 'stagedUpdate' && dataGridStyles.cellStagedUpdate,
        status === 'stagedUpdate' &&
          selectionEdges?.top === true &&
          dataGridStyles.cellStagedSelectionEdgeTop,
        status === 'stagedUpdate' &&
          selectionEdges?.right === true &&
          dataGridStyles.cellStagedSelectionEdgeRight,
        status === 'stagedUpdate' &&
          selectionEdges?.bottom === true &&
          dataGridStyles.cellStagedSelectionEdgeBottom,
        status === 'stagedUpdate' &&
          selectionEdges?.left === true &&
          dataGridStyles.cellStagedSelectionEdgeLeft,
        status === 'recentlyApplied' &&
          isSelected === false &&
          isCellSelected === false &&
          isActive === false &&
          isColumnActive === false &&
          dataGridStyles.cellRecentlyApplied,
        pinnedPosition !== false && dataGridStyles.pinnedCell,
      )}
      data-active={isActive === true ? '' : undefined}
      data-cell-selected={isCellSelected === true ? '' : undefined}
      data-column-id={target.columnId}
      data-pinned={pinnedPosition === false ? undefined : pinnedPosition}
      data-column-active={isColumnActive === true ? '' : undefined}
      data-row-active={isRowActive === true ? '' : undefined}
      data-selection-edges={
        selectionEdges === undefined
          ? undefined
          : (['top', 'right', 'bottom', 'left'] as const)
              .filter((edge) => selectionEdges[edge] === true)
              .join(' ')
      }
      data-selected={isSelected === true ? '' : undefined}
      data-status={status}
      data-slot="data-grid-cell"
      data-typography="mono"
      ref={registerCell}
      style={
        pinnedPosition === 'start'
          ? { insetInlineStart: `${cell.column.getStart('start')}px` }
          : pinnedPosition === 'end'
            ? { insetInlineEnd: `${cell.column.getAfter('end')}px` }
            : undefined
      }
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onFocus={() => {
        if (cell.getCanSelect() === true && cell.getIsFocused() === false) {
          table.setFocusedCell(target.rowId, target.columnId)
        }
      }}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onMouseEnter={cell.getSelectionExtendHandler()}
      onTouchStart={handleTouchStart}
      tabIndex={tabIndex}
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
