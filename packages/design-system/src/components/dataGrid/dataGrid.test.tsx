import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
  createColumnHelper,
  type CellSelectionState,
  type RowSelectionState,
  type SortingState,
  useTable,
} from '@tanstack/react-table'
import { useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DataGrid } from './dataGrid'
import { dataGridFeatures, type DataGridFeatures } from './dataGridFeatures'
import { getDataGridHeaderSortableId } from './dataGridReorder'
import { ContextMenu } from '../contextMenu/contextMenu'

let onDataGridDragEnd: ((event: unknown) => void) | undefined
let dragOverlayDropAnimation: unknown
let dragOverlaySource: { element?: Element | null; id: string } = {
  id: getDataGridHeaderSortableId('name'),
}
let droppingSortableId: string | null = null
vi.mock('@dnd-kit/react', () => ({
  DragOverlay: ({
    children,
    dropAnimation,
  }: {
    children?: (source: { element?: Element | null; id: string }) => ReactNode
    dropAnimation?: unknown
  }) => {
    dragOverlayDropAnimation = dropAnimation
    return <div data-testid="column-drag-overlay">{children?.(dragOverlaySource)}</div>
  },
  DragDropProvider: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode
    onDragEnd?: (event: unknown) => void
  }) => {
    onDataGridDragEnd = onDragEnd
    return children
  },
}))

vi.mock('@dnd-kit/react/sortable', () => ({
  isSortable: (source: { sortable?: boolean } | null | undefined) => source?.sortable === true,
  useSortable: (input: { id: string }) => {
    const targetRef = vi.fn()
    return {
      isDropping: input.id === droppingSortableId,
      isDragSource: false,
      ref: () => undefined,
      targetRef,
    }
  },
}))

vi.mock('@dnd-kit/abstract/modifiers', () => ({
  RestrictToHorizontalAxis: class RestrictToHorizontalAxis {},
}))

vi.mock('@dnd-kit/dom', () => ({
  Accessibility: class Accessibility {},
  AutoScroller: { configure: () => ({}) },
  Feedback: { configure: () => ({}) },
  PointerActivationConstraints: {
    Distance: class Distance {
      constructor(_options: { value: number }) {}
    },
  },
  PointerSensor: { configure: () => ({}) },
}))

vi.mock('@dnd-kit/dom/modifiers', () => ({
  RestrictToElement: { configure: () => ({}) },
}))

interface Person {
  id: string
  name: string
  role: string
}

const columnHelper = createColumnHelper<DataGridFeatures, Person>()
const columns = columnHelper.columns([
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('role', { header: 'Role' }),
])
const columnsWithFixedId = columnHelper.columns([
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('role', { header: 'Role' }),
])
const interactiveCellColumns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: 'Name',
    cell: ({ getValue }) => <a href="#person">{getValue()}</a>,
  }),
])
const unsubscribedSelectionColumns = columnHelper.columns([
  columnHelper.display({
    id: 'select',
    enableCellSelection: false,
    header: ({ table }) => (
      <input
        aria-label="Select every person"
        checked={table.getIsAllRowsSelected()}
        onChange={(event) => {
          table.toggleAllRowsSelected(event.currentTarget.checked)
        }}
        type="checkbox"
      />
    ),
  }),
  ...columns,
])
const rows: Person[] = [
  { id: 'person-1', name: 'Ada', role: 'Engineer' },
  { id: 'person-2', name: 'Grace', role: 'Admiral' },
]

interface TestDataGridProps {
  activeColumnId?: string | null
  activeRowId?: string | null
  data?: Person[]
  composeViewport?: (viewport: ReactElement) => ReactElement
  disabledCellRowIds?: ReadonlySet<string>
  emptyContent?: ReactNode
  focusRequest?: {
    requestId: number
    target: { columnId: string; rowId: string }
  } | null
  getRowStatus?: (row: { id: string }) => 'default' | 'recentlyInserted' | 'stagedDeletion'
  getCellStatus?: (cell: {
    column: { id: string }
    row: { id: string }
  }) => 'default' | 'recentlyApplied' | 'stagedUpdate'
  initialCellSelection?: CellSelectionState
  loading?: boolean
  onCellActivate?: (target: { columnId: string; rowId: string }) => void
  onCellEditRequest?: (target: { columnId: string; rowId: string }) => void
  onCellContextMenu?: (target: { columnId: string; rowId: string }) => void
  onColumnActivate?: (columnId: string | null) => void
  onRowActivate?: (rowId: string) => void
  onRowContextMenu?: (rowId: string) => void
  resizingColumnId?: string | null
  rowRendering?: 'all' | 'virtual'
  scrollResetKey?: string
  selectedRowIds?: string[]
}

function TestDataGrid({
  activeColumnId = null,
  activeRowId = null,
  data = rows,
  composeViewport = (viewport) => viewport,
  disabledCellRowIds = new Set(),
  emptyContent = 'No people',
  focusRequest = null,
  getCellStatus,
  getRowStatus,
  initialCellSelection = [],
  loading = false,
  onCellActivate,
  onCellEditRequest,
  onCellContextMenu,
  onColumnActivate,
  onRowActivate,
  onRowContextMenu,
  resizingColumnId = null,
  rowRendering,
  scrollResetKey,
  selectedRowIds = [],
}: TestDataGridProps) {
  const [cellSelection, setCellSelection] = useState(initialCellSelection)
  const rowSelection = Object.fromEntries(
    selectedRowIds.map((rowId) => [rowId, true as const]),
  ) satisfies RowSelectionState
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data,
    enableCellSelection: (cell) => disabledCellRowIds.has(cell.row.id) === false,
    getRowId: (row) => row.id,
    state: {
      cellSelection,
      columnResizing: {
        columnSizingStart: [],
        deltaOffset: null,
        deltaPercentage: null,
        isResizingColumn: resizingColumnId ?? false,
        startOffset: null,
        startSize: null,
      },
      rowSelection,
    },
    onCellSelectionChange: setCellSelection,
  })

  return (
    <DataGrid.Root
      table={table}
      activeColumnId={activeColumnId}
      activeRowId={activeRowId}
      focusRequest={focusRequest}
      getCellStatus={getCellStatus}
      getRowStatus={getRowStatus}
      onCellActivate={onCellActivate}
      onCellEditRequest={onCellEditRequest}
      onCellContextMenu={
        onCellContextMenu === undefined ? undefined : (target) => onCellContextMenu(target)
      }
      onColumnActivate={onColumnActivate}
      onRowActivate={onRowActivate}
      onRowContextMenu={
        onRowContextMenu === undefined ? undefined : (rowId) => onRowContextMenu(rowId)
      }
    >
      {composeViewport(
        <DataGrid.Viewport scrollResetKey={scrollResetKey}>
          <DataGrid.Table aria-label="People">
            <DataGrid.Content
              loading={loading}
              emptyContent={emptyContent}
              loadingContent="Loading people"
              rowRendering={rowRendering}
            />
          </DataGrid.Table>
        </DataGrid.Viewport>,
      )}
    </DataGrid.Root>
  )
}

describe('DataGrid scrollbar', () => {
  it('uses overlay tracks outside its two-axis viewport', () => {
    const { container } = render(<TestDataGrid />)

    const viewport = container.querySelector('[data-slot="data-grid-viewport"]')
    const scrollbars = Array.from(container.querySelectorAll('[data-slot="scroll-area-scrollbar"]'))

    expect(viewport?.getAttribute('data-scrollbar')).toBe('hidden')
    expect(scrollbars.map((scrollbar) => scrollbar.getAttribute('data-orientation'))).toEqual([
      'vertical',
      'horizontal',
    ])
    expect(scrollbars.every((scrollbar) => viewport?.contains(scrollbar) === false)).toBe(true)
    expect(
      container
        .querySelector('[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]')
        ?.getAttribute('data-placement'),
    ).toBe('body')
  })

  it('resets viewport scroll without remounting table content', () => {
    const { container, rerender } = render(<TestDataGrid scrollResetKey="page-1" />)
    const viewport = container.querySelector<HTMLElement>('[data-slot="data-grid-viewport"]')

    expect(viewport).not.toBeNull()
    if (viewport === null) {
      return
    }
    viewport.scrollLeft = 120
    viewport.scrollTop = 240

    rerender(<TestDataGrid scrollResetKey="page-2" />)

    expect(container.querySelector('[data-slot="data-grid-viewport"]')).toBe(viewport)
    expect(viewport.scrollLeft).toBe(0)
    expect(viewport.scrollTop).toBe(0)
  })
})

function ExpandedTestDataGrid() {
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (row) => row.id,
  })
  const firstRow = table.getRowModel().rows[0]

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
  )
}

function InteractiveHeaderDataGrid({
  onColumnActivate,
}: {
  onColumnActivate: (columnId: string | null) => void
}) {
  const interactiveColumns = columnHelper.columns([
    columnHelper.accessor('name', {
      header: () => <button type="button">Sort name</button>,
    }),
  ])
  const table = useTable({
    features: dataGridFeatures,
    columns: interactiveColumns,
    data: rows,
    getRowId: (row) => row.id,
  })

  return (
    <DataGrid.Root table={table} onColumnActivate={onColumnActivate}>
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Sortable people">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  )
}

function InteractiveCellDataGrid() {
  const [cellSelection, setCellSelection] = useState<CellSelectionState>([])
  const table = useTable({
    features: dataGridFeatures,
    columns: interactiveCellColumns,
    data: rows,
    getRowId: (row) => row.id,
    state: { cellSelection },
    onCellSelectionChange: setCellSelection,
  })

  return (
    <DataGrid.Root table={table}>
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Linked people">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  )
}

function KeyboardSortableDataGrid({ onSortingChange }: { onSortingChange: () => void }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (row) => row.id,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting(updater)
      onSortingChange()
    },
  })

  return (
    <DataGrid.Root table={table}>
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Sortable people">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  )
}

function DismissibleColumnDataGrid() {
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (row) => row.id,
  })

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
  )
}

function SelectionHitAreaDataGrid({
  onCellActivate,
}: {
  onCellActivate: (target: { columnId: string; rowId: string }) => void
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const selectionColumns = columnHelper.columns([
    columnHelper.display({
      id: 'select',
      enableCellSelection: false,
      header: ({ table }) => (
        <input
          aria-label="Select all rows"
          checked={table.getIsAllRowsSelected()}
          onChange={(event) => {
            table.toggleAllRowsSelected(event.currentTarget.checked)
          }}
          type="checkbox"
        />
      ),
      cell: ({ row }) => (
        <input
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onChange={(event) => {
            row.toggleSelected(event.currentTarget.checked)
          }}
          type="checkbox"
        />
      ),
    }),
    ...columns,
  ])
  const table = useTable({
    features: dataGridFeatures,
    columns: selectionColumns,
    data: rows,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  })

  return (
    <DataGrid.Root table={table} onCellActivate={onCellActivate}>
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Selectable people">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  )
}

function FixedGeometryDataGrid() {
  const fixedColumns = columnHelper.columns([
    columnHelper.accessor('name', { header: 'Name', size: 120 }),
    columnHelper.accessor('role', { header: 'Role', size: 180 }),
  ])
  const table = useTable(
    {
      features: dataGridFeatures,
      columns: fixedColumns,
      data: rows,
      getRowId: (row) => row.id,
    },
    () => null,
  )

  return (
    <>
      <button
        type="button"
        onClick={() => {
          table.setColumnSizing({ name: 220 })
        }}
      >
        Resize name
      </button>
      <button
        type="button"
        onClick={() => {
          table.setColumnOrder(['role', 'name'])
        }}
      >
        Move role first
      </button>
      <button
        type="button"
        onClick={() => {
          table.setColumnVisibility({ role: false })
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
  )
}

function UnsubscribedSelectionDataGrid({
  activeColumnId = null,
}: {
  activeColumnId?: string | null
}) {
  const table = useTable(
    {
      features: dataGridFeatures,
      columns: unsubscribedSelectionColumns,
      data: rows,
      enableRowSelection: true,
      getRowId: (row) => row.id,
    },
    () => null,
  )

  return (
    <>
      <button
        type="button"
        onClick={() => {
          table.getRowModel().rows[0]?.toggleSelected()
        }}
      >
        Toggle Ada row
      </button>
      <button
        type="button"
        onClick={() => {
          table.toggleAllRowsSelected(true)
        }}
      >
        Select every row externally
      </button>
      <DataGrid.Root table={table} activeColumnId={activeColumnId}>
        <DataGrid.Viewport>
          <DataGrid.Table aria-label="Unsubscribed people">
            <DataGrid.Content />
          </DataGrid.Table>
        </DataGrid.Viewport>
      </DataGrid.Root>
    </>
  )
}

function KeyboardResizableDataGrid() {
  const resizableColumns = columnHelper.columns([
    columnHelper.accessor('name', {
      header: 'Name',
      maxSize: 140,
      minSize: 100,
      size: 120,
    }),
    columnHelper.accessor('role', { header: 'Role', size: 180 }),
  ])
  const table = useTable({
    features: dataGridFeatures,
    columns: resizableColumns,
    data: rows,
    getRowId: (row) => row.id,
  })

  return (
    <DataGrid.Root table={table}>
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Keyboard resizable people">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  )
}

function ReorderableDataGrid({
  columnDragPreview,
  initialColumnOrder = ['name', 'role'],
  includeFixedId = false,
  onColumnOrderChange,
  reorderableColumnIds = ['name', 'role'],
}: {
  columnDragPreview?: (columnId: string) => ReactNode
  initialColumnOrder?: string[]
  includeFixedId?: boolean
  onColumnOrderChange: (columnIds: string[]) => void
  reorderableColumnIds?: string[]
}) {
  const [columnOrder, setColumnOrder] = useState(initialColumnOrder)
  const table = useTable({
    features: dataGridFeatures,
    columns: includeFixedId === true ? columnsWithFixedId : columns,
    data: rows,
    getRowId: (row) => row.id,
    state: { columnOrder },
    onColumnOrderChange: (updater) => {
      setColumnOrder((currentColumnOrder) => {
        const nextColumnOrder =
          typeof updater === 'function' ? updater(currentColumnOrder) : updater
        onColumnOrderChange(nextColumnOrder)
        return nextColumnOrder
      })
    },
  })

  return (
    <DataGrid.Root
      table={table}
      columnDragPreview={columnDragPreview}
      reorderableColumnIds={reorderableColumnIds}
    >
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="Reorderable people">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  )
}

afterEach(() => {
  cleanup()
  dragOverlayDropAnimation = undefined
  dragOverlaySource = { id: getDataGridHeaderSortableId('name') }
  droppingSortableId = null
  onDataGridDragEnd = undefined
})

describe('DataGrid', () => {
  it('rejects duplicate reorder column ids', () => {
    expect(() =>
      render(
        <ReorderableDataGrid
          reorderableColumnIds={['name', 'name']}
          onColumnOrderChange={() => undefined}
        />,
      ),
    ).toThrow('DataGrid reorderableColumnIds values must be unique')
  })

  it('preserves the focused header when reorder behavior loads', async () => {
    render(<ReorderableDataGrid onColumnOrderChange={() => undefined} />)
    const header = screen.getByRole('columnheader', { name: 'Name' })
    header.focus()
    expect(header.hasAttribute('data-reorderable')).toBe(false)

    await waitFor(() => {
      expect(onDataGridDragEnd).toBeTypeOf('function')
    })

    const reorderedHeader = screen.getByRole('columnheader', { name: 'Name' })
    expect(document.activeElement).toBe(reorderedHeader)
    expect(reorderedHeader.hasAttribute('data-reorderable')).toBe(true)
  })

  it('reuses loaded reorder behavior when another grid mounts', async () => {
    const firstGrid = render(<ReorderableDataGrid onColumnOrderChange={() => undefined} />)
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: 'Name' }).hasAttribute('data-reorderable'),
      ).toBe(true)
    })
    firstGrid.unmount()

    render(<ReorderableDataGrid onColumnOrderChange={() => undefined} />)

    expect(
      screen.getByRole('columnheader', { name: 'Name' }).hasAttribute('data-reorderable'),
    ).toBe(true)
  })

  it('renders semantic headers, rows, and visible cells from TanStack state', () => {
    render(<TestDataGrid />)

    expect(screen.getByRole('table', { name: 'People' })).toBeTruthy()
    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeTruthy()
  })

  it('keeps intrinsic, resized, reordered, and hidden column geometry aligned', () => {
    const intrinsicGrid = render(<TestDataGrid />)
    const intrinsicTable = intrinsicGrid.container.querySelector<HTMLElement>(
      '[data-slot="data-grid-table"]',
    )

    expect(intrinsicTable?.getAttribute('data-layout')).toBe('intrinsic')
    expect(intrinsicTable?.style.width).toBe('300px')
    intrinsicGrid.unmount()
    const fixedGrid = render(<FixedGeometryDataGrid />)

    const table = screen.getByRole('table', { name: 'Fixed geometry people' })
    const scrollSurface = table.closest('[data-slot="data-grid-scroll-surface"]')
    const columns = table.querySelectorAll('col')

    expect(scrollSurface).not.toBeNull()
    expect((scrollSurface as HTMLElement).style.width).toBe('300px')
    expect(table.style.width).toBe('300px')
    expect(Array.from(columns, (column) => column.style.width)).toEqual(['120px', '180px'])
    expect(table.querySelectorAll('[data-slot="data-grid-filler-cell"]')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Resize name' }))

    expect((scrollSurface as HTMLElement).style.width).toBe('400px')
    expect(table.style.width).toBe('400px')
    expect(Array.from(columns, (column) => column.style.width)).toEqual(['220px', '180px'])

    fixedGrid.unmount()
    render(<FixedGeometryDataGrid />)
    const reorderedTable = screen.getByRole('table', { name: 'Fixed geometry people' })

    fireEvent.click(screen.getByRole('button', { name: 'Move role first' }))

    expect(
      Array.from(reorderedTable.querySelectorAll('col'), (column) => column.style.width),
    ).toEqual(['180px', '120px'])
    expect(reorderedTable.style.width).toBe('300px')

    fireEvent.click(screen.getByRole('button', { name: 'Hide role' }))

    expect(
      Array.from(reorderedTable.querySelectorAll('col'), (column) => column.style.width),
    ).toEqual(['120px'])
    expect(reorderedTable.style.width).toBe('120px')
  })

  it('renders only the header when empty content is null', () => {
    const { container } = render(<TestDataGrid data={[]} emptyContent={null} />)

    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
    expect(container.querySelector('tbody')).toBeNull()
  })

  it('spans empty content across every visible column', () => {
    const { container } = render(<TestDataGrid data={[]} />)
    const messageBody = container.querySelector('[data-slot="data-grid-empty"]')
    const messageCell = messageBody?.querySelector(':scope > tr > td')
    const messageContent = messageCell?.querySelector(
      ':scope > [data-slot="data-grid-message-content"]',
    )

    expect(messageCell?.getAttribute('colspan')).toBe('2')
    expect(messageContent?.textContent).toBe('No people')
  })

  it('renders a spinner with explicit loading text without placeholder rows', () => {
    const { container } = render(<TestDataGrid loading />)

    expect(container.querySelector('[data-slot="spinner"]')).not.toBeNull()
    expect(
      container.querySelector('[data-slot="data-grid-loading"]')?.getAttribute('aria-busy'),
    ).toBe('true')
    expect(
      container.querySelector('[data-slot="data-grid-message-content"]')?.getAttribute('role'),
    ).toBe('status')
    expect(screen.getByText('Loading people')).toBeTruthy()
  })

  it('renders the default 100-row page without scroll-synchronized virtualization', () => {
    const data = Array.from({ length: 100 }, (_, index) => ({
      id: `person-${index + 1}`,
      name: `Person ${index + 1}`,
      role: 'Member',
    }))
    const { container } = render(<TestDataGrid data={data} rowRendering="virtual" />)

    expect(container.querySelectorAll('[data-slot="data-grid-row"]')).toHaveLength(100)
    expect(container.querySelector('[data-row-rendering="virtual"]')).toBeNull()
  })

  it('gives TanStack focused-cell state precedence over column highlighting', () => {
    render(
      <TestDataGrid
        activeRowId="person-1"
        activeColumnId="role"
        initialCellSelection={[
          {
            anchorRowId: 'person-1',
            anchorColumnId: 'role',
            focusRowId: 'person-1',
            focusColumnId: 'role',
          },
        ]}
        selectedRowIds={['person-2']}
      />,
    )

    const adaRow = screen.getByRole('row', { name: /Ada Engineer/ })
    const activeCell = screen.getByRole('cell', { name: 'Engineer' })
    const activeHeader = screen.getByRole('columnheader', { name: 'Role' })

    expect(adaRow.hasAttribute('data-active')).toBe(true)
    expect(activeHeader.hasAttribute('data-active')).toBe(false)
    expect(activeCell.hasAttribute('data-active')).toBe(true)
    expect(activeCell.hasAttribute('data-cell-selected')).toBe(true)
    expect(activeCell.hasAttribute('data-column-active')).toBe(false)
    expect(activeCell.hasAttribute('data-row-active')).toBe(true)
  })

  it('exposes recently inserted row status', () => {
    render(
      <TestDataGrid
        getRowStatus={(row) => (row.id === 'person-1' ? 'recentlyInserted' : 'default')}
      />,
    )

    const insertedRow = screen.getByRole('row', { name: /Ada Engineer/ })

    expect(insertedRow.getAttribute('data-status')).toBe('recentlyInserted')
    expect(screen.getByRole('row', { name: /Grace Admiral/ }).getAttribute('data-status')).toBe(
      'default',
    )
  })

  it('suppresses staged-update cell status for staged-deletion rows', () => {
    render(
      <TestDataGrid
        getCellStatus={() => 'stagedUpdate'}
        getRowStatus={(row) => (row.id === 'person-1' ? 'stagedDeletion' : 'default')}
      />,
    )

    const deletedRowCell = screen.getByRole('cell', { name: 'Engineer' })
    const updateCell = screen.getByRole('cell', { name: 'Admiral' })

    expect(deletedRowCell.getAttribute('data-status')).toBe('default')
    expect(updateCell.getAttribute('data-status')).toBe('stagedUpdate')
  })

  it('exposes recently applied cell status', () => {
    render(
      <TestDataGrid
        getCellStatus={(cell) =>
          cell.row.id === 'person-1' && cell.column.id === 'role' ? 'recentlyApplied' : 'default'
        }
      />,
    )

    const appliedCell = screen.getByRole('cell', { name: 'Engineer' })
    const defaultCell = screen.getByRole('cell', { name: 'Ada' })

    expect(appliedCell.getAttribute('data-status')).toBe('recentlyApplied')
    expect(defaultCell.getAttribute('data-status')).toBe('default')
  })

  it('does not apply active-column emphasis to cells that cannot be selected', () => {
    render(
      <TestDataGrid
        activeColumnId="role"
        disabledCellRowIds={new Set(['person-1'])}
        getRowStatus={(row) => (row.id === 'person-1' ? 'stagedDeletion' : 'default')}
      />,
    )

    const stagedCell = screen.getByRole('cell', { name: 'Engineer' })
    const selectableCell = screen.getByRole('cell', { name: 'Admiral' })

    expect(stagedCell.hasAttribute('data-column-active')).toBe(false)
    expect(selectableCell.hasAttribute('data-column-active')).toBe(true)
  })

  it('marks the header resize state without replacing the header', () => {
    const { rerender } = render(<TestDataGrid activeColumnId="role" />)
    const restingHandle = screen.getByRole('separator', { name: 'Resize role column' })

    expect(restingHandle.hasAttribute('data-resizing')).toBe(false)

    rerender(<TestDataGrid activeColumnId="role" resizingColumnId="role" />)

    const resizeHandle = screen.getByRole('separator', { name: 'Resize role column' })

    expect(resizeHandle).toBe(restingHandle)
    expect(resizeHandle.hasAttribute('data-resizing')).toBe(true)
  })

  it('reports header, row, cell, and cell context-menu activation targets', () => {
    const onColumnActivate = vi.fn()
    const onRowActivate = vi.fn()
    const onCellActivate = vi.fn()
    const onCellContextMenu = vi.fn()

    render(
      <TestDataGrid
        onColumnActivate={onColumnActivate}
        onRowActivate={onRowActivate}
        onCellActivate={onCellActivate}
        onCellContextMenu={onCellContextMenu}
      />,
    )

    fireEvent.click(screen.getByRole('columnheader', { name: 'Role' }))
    fireEvent.click(screen.getByRole('row', { name: /Ada Engineer/ }))
    const admiralCell = screen.getByRole('cell', { name: 'Admiral' })
    fireEvent.mouseDown(admiralCell)
    fireEvent.mouseUp(document)
    fireEvent.click(admiralCell)
    expect(fireEvent.contextMenu(screen.getByRole('cell', { name: 'Engineer' }))).toBe(false)

    expect(onColumnActivate).toHaveBeenCalledWith('role')
    expect(onRowActivate).toHaveBeenCalledWith('person-1')
    expect(onCellActivate).toHaveBeenCalledWith({ rowId: 'person-2', columnId: 'role' })
    expect(onCellContextMenu).toHaveBeenCalledWith({ rowId: 'person-1', columnId: 'role' })
  })

  it('replaces an unselected cell range on right-click and lets the request reach an ancestor menu trigger', () => {
    const onAncestorContextMenu = vi.fn()
    render(
      <div onContextMenu={onAncestorContextMenu}>
        <TestDataGrid
          initialCellSelection={[
            {
              anchorRowId: 'person-1',
              anchorColumnId: 'name',
              focusRowId: 'person-1',
              focusColumnId: 'name',
            },
          ]}
          onCellContextMenu={vi.fn()}
        />
      </div>,
    )

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Admiral' }))

    expect(screen.getByRole('cell', { name: 'Admiral' }).hasAttribute('data-cell-selected')).toBe(
      true,
    )
    expect(screen.getByRole('cell', { name: 'Ada' }).hasAttribute('data-cell-selected')).toBe(false)
    expect(onAncestorContextMenu).toHaveBeenCalledOnce()
  })

  it('opens a composed context menu when a body cell is right-clicked', async () => {
    render(
      <ContextMenu.Root>
        <TestDataGrid
          composeViewport={(viewport) => <ContextMenu.Trigger render={viewport} />}
          onCellContextMenu={vi.fn()}
        />
        <ContextMenu.Content>
          <ContextMenu.Item>Edit</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    )

    expect(fireEvent.contextMenu(screen.getByRole('cell', { name: 'Engineer' }))).toBe(false)

    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeTruthy()
  })

  it('preserves a multi-cell range when right-clicking inside it', () => {
    render(
      <TestDataGrid
        initialCellSelection={[
          {
            anchorRowId: 'person-1',
            anchorColumnId: 'name',
            focusRowId: 'person-2',
            focusColumnId: 'role',
          },
        ]}
        onCellContextMenu={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Engineer' }))

    expect(screen.getByRole('cell', { name: 'Ada' }).hasAttribute('data-cell-selected')).toBe(true)
    expect(screen.getByRole('cell', { name: 'Admiral' }).hasAttribute('data-cell-selected')).toBe(
      true,
    )
  })

  it('keeps row context targeting available from cells when no cell menu is configured', () => {
    const onRowContextMenu = vi.fn()
    render(<TestDataGrid onRowContextMenu={onRowContextMenu} />)

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Engineer' }))

    expect(onRowContextMenu).toHaveBeenCalledWith('person-1')
  })

  it('activates a cell once and requests editing once across a double-click sequence', () => {
    const onCellActivate = vi.fn()
    const onCellEditRequest = vi.fn()
    render(<TestDataGrid onCellActivate={onCellActivate} onCellEditRequest={onCellEditRequest} />)
    const cell = screen.getByRole('cell', { name: 'Engineer' })

    fireEvent.click(cell, { detail: 1 })
    fireEvent.click(cell, { detail: 2 })
    fireEvent.doubleClick(cell)

    expect(onCellActivate).toHaveBeenCalledOnce()
    expect(onCellEditRequest).toHaveBeenCalledOnce()
    expect(onCellEditRequest).toHaveBeenCalledWith({
      rowId: 'person-1',
      columnId: 'role',
    })
  })

  it('provides one body-cell entry point and moves its roving focus with arrow keys', async () => {
    render(<TestDataGrid />)
    const adaCell = screen.getByRole('cell', { name: 'Ada' })
    const engineerCell = screen.getByRole('cell', { name: 'Engineer' })
    const admiralCell = screen.getByRole('cell', { name: 'Admiral' })

    expect(adaCell.tabIndex).toBe(0)
    expect(engineerCell.tabIndex).toBe(-1)

    act(() => {
      adaCell.focus()
    })
    fireEvent.keyDown(adaCell, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(document.activeElement).toBe(engineerCell)
    })
    expect(engineerCell.tabIndex).toBe(0)
    expect(adaCell.tabIndex).toBe(-1)

    fireEvent.keyDown(engineerCell, { key: 'ArrowDown' })

    await waitFor(() => {
      expect(document.activeElement).toBe(admiralCell)
    })
    expect(admiralCell.tabIndex).toBe(0)
  })

  it('renders internally owned row and bulk selection without a root table subscription', () => {
    render(<UnsubscribedSelectionDataGrid />)
    const adaRow = screen.getByRole('cell', { name: 'Ada' }).closest('tr')
    const checkbox = screen.getByRole('checkbox', { name: 'Select every person' })

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Ada row' }))
    expect(adaRow?.getAttribute('aria-selected')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Select every row externally' }))
    expect((checkbox as HTMLInputElement).checked).toBe(true)
  })

  it('renders internally owned cell selection and focus without a root table subscription', async () => {
    render(<UnsubscribedSelectionDataGrid activeColumnId="role" />)
    const roleHeader = screen.getByRole('columnheader', { name: 'Role' })
    const adaCell = screen.getByRole('cell', { name: 'Ada' })
    const engineerCell = screen.getByRole('cell', { name: 'Engineer' })

    expect(roleHeader.hasAttribute('data-active')).toBe(true)
    fireEvent.mouseDown(adaCell)
    fireEvent.mouseUp(document)

    expect(adaCell.hasAttribute('data-cell-selected')).toBe(true)
    expect(roleHeader.hasAttribute('data-active')).toBe(false)

    adaCell.focus()
    fireEvent.keyDown(adaCell, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(document.activeElement).toBe(engineerCell)
    })
    expect(adaCell.tabIndex).toBe(-1)
    expect(engineerCell.tabIndex).toBe(0)
  })

  it('requests editing with Enter and preserves Space activation', () => {
    const onCellActivate = vi.fn()
    const onCellEditRequest = vi.fn()
    render(<TestDataGrid onCellActivate={onCellActivate} onCellEditRequest={onCellEditRequest} />)
    const cell = screen.getByRole('cell', { name: 'Engineer' })

    cell.focus()
    fireEvent.keyDown(cell, { key: 'Enter' })
    fireEvent.keyDown(cell, { key: ' ' })

    expect(onCellEditRequest).toHaveBeenCalledWith({
      rowId: 'person-1',
      columnId: 'role',
    })
    expect(onCellActivate).toHaveBeenCalledOnce()
    expect(onCellActivate).toHaveBeenCalledWith({
      rowId: 'person-1',
      columnId: 'role',
    })
  })

  it('focuses a semantic body-cell request after focus leaves the grid', async () => {
    const { rerender } = render(<TestDataGrid />)
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()

    rerender(
      <TestDataGrid
        focusRequest={{
          requestId: 1,
          target: { rowId: 'person-2', columnId: 'role' },
        }}
      />,
    )

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('cell', { name: 'Admiral' }))
    })
    outside.remove()
  })

  it('keeps a semantic focus request pending until its cell is available', async () => {
    const focusRequest = {
      requestId: 1,
      target: { rowId: 'person-2', columnId: 'role' },
    }
    const { rerender } = render(<TestDataGrid data={[]} focusRequest={focusRequest} />)

    rerender(<TestDataGrid data={rows} focusRequest={focusRequest} />)

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('cell', { name: 'Admiral' }))
    })
  })

  it('does not handle body-cell navigation from an interactive descendant', () => {
    render(<InteractiveCellDataGrid />)
    const link = screen.getByRole('link', { name: 'Ada' })
    const cell = link.closest('td')

    expect(cell).not.toBeNull()
    link.focus()
    fireEvent.keyDown(link, { key: 'ArrowRight' })

    expect(document.activeElement).toBe(link)
    expect(cell?.hasAttribute('data-active')).toBe(false)
  })

  it('exposes keyboard-resizable separators with bounded values and reset behavior', () => {
    render(<KeyboardResizableDataGrid />)
    const table = screen.getByRole('table', { name: 'Keyboard resizable people' })
    const handle = screen.getByRole('separator', { name: 'Resize name column' })
    const nameColumn = table.querySelector('col')

    expect(handle.getAttribute('aria-orientation')).toBe('vertical')
    expect(handle.getAttribute('aria-valuemin')).toBe('100')
    expect(handle.getAttribute('aria-valuemax')).toBe('140')
    expect(handle.getAttribute('aria-valuenow')).toBe('120')

    for (let index = 0; index < 4; index += 1) {
      fireEvent.keyDown(handle, { key: 'ArrowRight' })
    }
    expect(nameColumn?.style.width).toBe('140px')
    expect(handle.getAttribute('aria-valuenow')).toBe('140')

    for (let index = 0; index < 8; index += 1) {
      fireEvent.keyDown(handle, { key: 'ArrowLeft' })
    }
    expect(nameColumn?.style.width).toBe('100px')
    expect(handle.getAttribute('aria-valuenow')).toBe('100')

    fireEvent.keyDown(handle, { key: 'Enter' })
    expect(nameColumn?.style.width).toBe('120px')
    expect(handle.getAttribute('aria-valuenow')).toBe('120')
  })

  it('ends cell dragging in the grid document', () => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const iframeDocument = iframe.contentDocument
    if (iframeDocument === null) {
      throw new Error('Expected iframe document')
    }
    const { unmount } = render(createPortal(<TestDataGrid />, iframeDocument.body))
    const iframeScreen = within(iframeDocument.body)
    const adaCell = iframeScreen.getByRole('cell', { name: 'Ada' })
    const admiralCell = iframeScreen.getByRole('cell', { name: 'Admiral' })

    fireEvent.mouseDown(adaCell)
    fireEvent.mouseUp(iframeDocument)
    fireEvent.mouseEnter(admiralCell)

    expect(adaCell.hasAttribute('data-cell-selected')).toBe(true)
    expect(admiralCell.hasAttribute('data-cell-selected')).toBe(false)
    unmount()

    const interactivePortal = render(createPortal(<InteractiveCellDataGrid />, iframeDocument.body))
    const link = iframeScreen.getByRole('link', { name: 'Ada' })
    const linkCell = link.closest('td')
    fireEvent.mouseDown(link)
    fireEvent.mouseUp(iframeDocument)

    expect(linkCell?.hasAttribute('data-cell-selected')).toBe(false)
    interactivePortal.unmount()
    iframe.remove()
  })

  it('supports expanded content through manual compound composition', () => {
    render(<ExpandedTestDataGrid />)

    const details = screen.getByRole('cell', { name: 'Ada details' })
    expect(details.getAttribute('colspan')).toBe('2')
  })

  it('activates a column when its interactive header content is used', () => {
    const onColumnActivate = vi.fn()
    render(<InteractiveHeaderDataGrid onColumnActivate={onColumnActivate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sort name' }))

    expect(onColumnActivate).toHaveBeenCalledWith('name')
  })

  it('activates a focused column with Space', () => {
    const onColumnActivate = vi.fn()
    render(<TestDataGrid onColumnActivate={onColumnActivate} />)
    const header = screen.getByRole('columnheader', { name: 'Name' })

    expect(header.tabIndex).toBe(0)
    fireEvent.keyDown(header, { key: ' ' })

    expect(onColumnActivate).toHaveBeenCalledWith('name')
  })

  it('activates a row consistently from its cell when cell activation is not configured', () => {
    const onRowActivate = vi.fn()
    render(<TestDataGrid onRowActivate={onRowActivate} />)
    const cell = screen.getByRole('cell', { name: 'Ada' })

    fireEvent.click(cell)
    expect(onRowActivate).toHaveBeenCalledWith('person-1')

    onRowActivate.mockClear()
    fireEvent.keyDown(cell, { key: 'Enter' })

    expect(onRowActivate).toHaveBeenCalledWith('person-1')
  })

  it('deactivates a column when its active header is clicked again', () => {
    render(<DismissibleColumnDataGrid />)
    const header = screen.getByRole('columnheader', { name: 'Role' })

    fireEvent.click(header)
    expect(header.hasAttribute('data-active')).toBe(true)

    fireEvent.click(header)
    expect(header.hasAttribute('data-active')).toBe(false)
  })

  it('deactivates a column when a pointer press occurs outside the table', () => {
    render(<DismissibleColumnDataGrid />)
    const header = screen.getByRole('columnheader', { name: 'Role' })

    fireEvent.click(header)
    fireEvent.pointerDown(document.body)

    expect(header.hasAttribute('data-active')).toBe(false)
  })

  it('uses the complete checkbox cell as the selection hit area', () => {
    const onCellActivate = vi.fn()
    render(<SelectionHitAreaDataGrid onCellActivate={onCellActivate} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Select Ada' })
    const checkboxCell = checkbox.closest('td')

    expect(checkboxCell).not.toBeNull()
    fireEvent.mouseDown(checkboxCell as HTMLTableCellElement)
    fireEvent.mouseUp(document)
    fireEvent.click(checkboxCell as HTMLTableCellElement)

    expect((checkbox as HTMLInputElement).checked).toBe(true)
    expect(document.activeElement).not.toBe(checkboxCell)
    expect(onCellActivate).not.toHaveBeenCalled()
    expect(checkboxCell?.hasAttribute('data-cell-selected')).toBe(false)
  })

  it('keeps table content stable until a column drag is dropped', async () => {
    const onColumnOrderChange = vi.fn()
    render(<ReorderableDataGrid onColumnOrderChange={onColumnOrderChange} />)

    await waitFor(() => {
      expect(onDataGridDragEnd).toBeTypeOf('function')
    })

    const operation = {
      source: {
        id: getDataGridHeaderSortableId('role'),
        initialIndex: 1,
        index: 1,
        sortable: true,
        type: 'column',
      },
      target: {
        id: getDataGridHeaderSortableId('name'),
        index: 0,
        sortable: true,
        type: 'column',
      },
    }

    expect(onColumnOrderChange).not.toHaveBeenCalled()
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Name',
      'Role',
    ])

    act(() => {
      onDataGridDragEnd?.({ canceled: false, operation })
    })

    expect(onColumnOrderChange).toHaveBeenCalledWith(['role', 'name'])
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Role',
      'Name',
    ])
  })

  it('preserves fixed columns when TanStack commits a reordered subset', async () => {
    const onColumnOrderChange = vi.fn()
    render(
      <ReorderableDataGrid
        includeFixedId
        initialColumnOrder={['id', 'name', 'role']}
        onColumnOrderChange={onColumnOrderChange}
      />,
    )

    await waitFor(() => {
      expect(onDataGridDragEnd).toBeTypeOf('function')
    })

    act(() => {
      onDataGridDragEnd?.({
        canceled: false,
        operation: {
          source: {
            id: getDataGridHeaderSortableId('role'),
            initialIndex: 1,
            index: 1,
            sortable: true,
            type: 'column',
          },
          target: {
            id: getDataGridHeaderSortableId('name'),
            index: 0,
            sortable: true,
            type: 'column',
          },
        },
      })
    })

    expect(onColumnOrderChange).toHaveBeenCalledWith(['id', 'role', 'name'])
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'ID',
      'Role',
      'Name',
    ])
  })

  it('moves a focused header with Shift and horizontal arrow keys', async () => {
    const onColumnOrderChange = vi.fn()
    render(<ReorderableDataGrid onColumnOrderChange={onColumnOrderChange} />)

    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: 'Name' }).hasAttribute('data-reorderable'),
      ).toBe(true)
    })

    const header = screen.getByRole('columnheader', { name: 'Name' })
    header.focus()
    fireEvent.keyDown(header, { key: 'ArrowRight', shiftKey: true })

    expect(onColumnOrderChange).toHaveBeenCalledWith(['role', 'name'])
    expect(document.activeElement).toBe(screen.getByRole('columnheader', { name: 'Name' }))
  })

  it('renders an application-provided drag preview', async () => {
    render(
      <ReorderableDataGrid
        columnDragPreview={(columnId) => <span>{`Marker ${columnId}`}</span>}
        onColumnOrderChange={() => undefined}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('column-drag-overlay').textContent).toBe('Marker name')
    })
  })

  it('keeps the source header slot reserved while a drop settles', async () => {
    droppingSortableId = getDataGridHeaderSortableId('name')
    render(<ReorderableDataGrid onColumnOrderChange={() => undefined} />)

    await waitFor(() => {
      const header = document.querySelector<HTMLElement>('[data-column-id="name"]')
      expect(header).not.toBeNull()
      const source = header?.querySelector<HTMLElement>(
        '[data-slot="data-grid-header-drag-source"]',
      )
      expect(header?.hasAttribute('data-dragging')).toBe(true)
      expect(source).not.toBeNull()
      expect(source?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  it('reports sort state and toggles sorting from a focused header with Enter', () => {
    const onSortingChange = vi.fn()
    render(<KeyboardSortableDataGrid onSortingChange={onSortingChange} />)

    const header = screen.getByRole('columnheader', { name: 'Name' })
    expect(header.getAttribute('aria-sort')).toBe('none')
    expect(header.tabIndex).toBe(0)
    header.focus()
    fireEvent.keyDown(header, { key: 'Enter' })

    expect(onSortingChange).toHaveBeenCalledOnce()
  })

  it('preserves native columnheader semantics and valid sort state when reordering is attached', async () => {
    render(<ReorderableDataGrid onColumnOrderChange={() => undefined} />)

    await waitFor(() => {
      const header = screen.getByRole('columnheader', { name: 'Name' })
      expect(header.getAttribute('role')).toBeNull()
      expect(header.getAttribute('aria-sort')).toBe('none')
    })
  })

  it('does not animate the drag overlay after the pointer is released', async () => {
    render(<ReorderableDataGrid onColumnOrderChange={() => undefined} />)

    await waitFor(() => {
      expect(dragOverlayDropAnimation).toBeNull()
    })
  })

  it('does not publish a transient column order when a drag is canceled', async () => {
    const onColumnOrderChange = vi.fn()
    render(<ReorderableDataGrid onColumnOrderChange={onColumnOrderChange} />)

    await waitFor(() => {
      expect(onDataGridDragEnd).toBeTypeOf('function')
    })

    const operation = {
      source: {
        id: getDataGridHeaderSortableId('role'),
        initialIndex: 1,
        index: 1,
        sortable: true,
        type: 'column',
      },
      target: {
        id: getDataGridHeaderSortableId('name'),
        index: 0,
        sortable: true,
        type: 'column',
      },
    }

    act(() => {
      onDataGridDragEnd?.({ canceled: true, operation })
    })

    expect(onColumnOrderChange).not.toHaveBeenCalled()
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Name',
      'Role',
    ])
    expect(
      screen
        .getAllByRole('cell')
        .slice(0, 2)
        .map((cell) => cell.textContent),
    ).toEqual(['Ada', 'Engineer'])
  })
})
