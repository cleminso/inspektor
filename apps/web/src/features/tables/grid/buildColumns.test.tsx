import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ColumnOrderState, type SortingState, useTable } from '@tanstack/react-table'
import type { DynamicTableRow } from 'jazz-tools'
import { useMemo, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DataGrid, dataGridFeatures } from '@inspektor/ds'

import { buildDataGridColumns } from '@tables/grid/buildColumns'

const doNothing = () => undefined

function TestTable({
  columns,
  data,
  disabledRowIds,
  initialColumnSizing,
  initialColumnOrder,
  onColumnMenuOpen,
  onColumnMove,
  stagedValuesByRowId,
  onUndoRowDeletions,
  onSortingChange,
}: {
  columns?: Parameters<typeof buildDataGridColumns>[0]['columns']
  data?: DynamicTableRow[]
  disabledRowIds?: ReadonlySet<string>
  initialColumnSizing?: Record<string, number>
  initialColumnOrder?: ColumnOrderState
  onColumnMenuOpen?: (columnId: string) => void
  onColumnMove?: Parameters<typeof buildDataGridColumns>[0]['onColumnMove']
  stagedValuesByRowId?: Parameters<typeof buildDataGridColumns>[0]['stagedValuesByRowId']
  onUndoRowDeletions?: (rowIds: readonly string[]) => void
  onSortingChange: () => void
}): React.ReactElement {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(initialColumnOrder ?? [])
  const columnDefs = useMemo(
    () =>
      buildDataGridColumns({
        columns: columns ?? [
          {
            accessorKey: 'name',
            column: null,
            id: 'name',
            isSortable: true,
            label: 'Name',
          },
        ],
        onColumnMenuOpen,
        onColumnMove,
        stagedValuesByRowId,
        onUndoRowDeletions,
      }),
    [columns, onColumnMenuOpen, onColumnMove, onUndoRowDeletions, stagedValuesByRowId],
  )
  const table = useTable({
    features: dataGridFeatures,
    columns: columnDefs,
    data: data ?? [{ id: 'row-1', name: 'Ada' } as DynamicTableRow],
    enableRowSelection: (row) => disabledRowIds?.has(row.id) !== true,
    getRowId: (row) => String(row.id),
    initialState:
      initialColumnSizing === undefined ? undefined : { columnSizing: initialColumnSizing },
    state: { columnOrder, sorting },
    onColumnOrderChange: setColumnOrder,
    onSortingChange: (updater) => {
      setSorting(updater)
      onSortingChange()
    },
  })

  return (
    <DataGrid.Root table={table}>
      <DataGrid.Viewport>
        <DataGrid.Table aria-label="People">
          <DataGrid.Content />
        </DataGrid.Table>
      </DataGrid.Viewport>
    </DataGrid.Root>
  )
}

afterEach(cleanup)

describe('buildDataGridColumns', () => {
  it('renders valid staged values over source row values', () => {
    const data = [{ id: 'row-1', name: 'Ada' } as DynamicTableRow]
    const { rerender } = render(
      <TestTable
        data={data}
        stagedValuesByRowId={{ 'row-1': { name: 'Grace' } }}
        onSortingChange={doNothing}
      />,
    )

    expect(screen.getByText('Grace')).toBeTruthy()
    expect(screen.queryByText('Ada')).toBeNull()

    rerender(<TestTable data={data} stagedValuesByRowId={{}} onSortingChange={doNothing} />)

    expect(screen.getByText('Ada')).toBeTruthy()
    expect(screen.queryByText('Grace')).toBeNull()
  })

  it('projects an explicit staged null instead of falling back to the source value', () => {
    render(
      <TestTable
        columns={[
          {
            accessorKey: 'name',
            column: { column_type: { type: 'Text' }, name: 'name', nullable: true } as never,
            id: 'name',
            isSortable: true,
            label: 'Name',
          },
        ]}
        data={[{ id: 'row-1', name: 'Ada' } as DynamicTableRow]}
        stagedValuesByRowId={{ 'row-1': { name: null } }}
        onSortingChange={doNothing}
      />,
    )

    expect(screen.getByText('NULL')).toBeTruthy()
    expect(screen.queryByText('Ada')).toBeNull()
  })

  it('replaces an unavailable row checkbox with an Undo2 deletion action', async () => {
    const onUndoRowDeletions = vi.fn()
    const data = [{ id: 'row-1', name: 'Ada' } as DynamicTableRow]
    const { rerender } = render(
      <TestTable
        data={data}
        disabledRowIds={new Set(['row-1'])}
        onUndoRowDeletions={onUndoRowDeletions}
        onSortingChange={doNothing}
      />,
    )

    const undoButton = screen.getByRole('button', { name: 'Undo pending deletion for row row-1' })

    expect(screen.queryByRole('checkbox', { name: 'Select row row-1' })).toBeNull()
    expect(undoButton.querySelector('.lucide-undo-2')).toBeTruthy()

    fireEvent.focus(undoButton)
    expect(await screen.findByText('Undo pending deletion')).toBeTruthy()

    fireEvent.click(undoButton)

    expect(onUndoRowDeletions).toHaveBeenCalledWith(['row-1'])

    rerender(
      <TestTable
        data={data}
        disabledRowIds={new Set()}
        onUndoRowDeletions={onUndoRowDeletions}
        onSortingChange={doNothing}
      />,
    )

    const restoredCheckbox = screen.getByRole('checkbox', { name: 'Select row row-1' })
    await waitFor(() => expect(document.activeElement).toBe(restoredCheckbox))
  })

  it('replaces the page checkbox with one Undo2 action when every loaded row is deleted', async () => {
    const onUndoRowDeletions = vi.fn()
    const data = [
      { id: 'row-1', name: 'Ada' } as DynamicTableRow,
      { id: 'row-2', name: 'Grace' } as DynamicTableRow,
    ]
    const { rerender } = render(
      <TestTable
        data={data}
        disabledRowIds={new Set(['row-1', 'row-2'])}
        onUndoRowDeletions={onUndoRowDeletions}
        onSortingChange={doNothing}
      />,
    )

    const undoButton = screen.getByRole('button', {
      name: 'Undo pending deletion for all loaded rows',
    })
    expect(screen.queryByRole('checkbox', { name: 'Select all loaded rows' })).toBeNull()
    fireEvent.click(undoButton)
    expect(onUndoRowDeletions).toHaveBeenCalledOnce()
    expect(onUndoRowDeletions).toHaveBeenCalledWith(['row-1', 'row-2'])

    rerender(
      <TestTable
        data={data}
        disabledRowIds={new Set()}
        onUndoRowDeletions={onUndoRowDeletions}
        onSortingChange={doNothing}
      />,
    )
    const restoredCheckbox = screen.getByRole('checkbox', { name: 'Select all loaded rows' })
    await waitFor(() => expect(document.activeElement).toBe(restoredCheckbox))
  })

  it('keeps direct header clicks for column activation and sorts from the action menu', () => {
    const onSortingChange = vi.fn()
    const onColumnMenuOpen = vi.fn()
    render(<TestTable onColumnMenuOpen={onColumnMenuOpen} onSortingChange={onSortingChange} />)

    const header = screen.getByRole('columnheader', { name: /Name/ })
    fireEvent.click(header)

    expect(onSortingChange).not.toHaveBeenCalled()

    const menuButton = screen.getByRole('button', { name: 'Open Name column menu' })

    expect(menuButton.getAttribute('data-size')).toBe('xs')
    expect(menuButton.getAttribute('data-glyph-size')).toBe('compact')
    expect(menuButton.querySelector('[data-slot="icon"]')?.getAttribute('data-size')).toBe('xs')

    fireEvent.click(menuButton)
    expect(onColumnMenuOpen).toHaveBeenCalledWith('name')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sort Ascending' }))

    expect(onSortingChange).toHaveBeenCalledOnce()
  })

  it('opens the same column actions by right-clicking a header', () => {
    render(<TestTable onSortingChange={() => undefined} />)

    fireEvent.contextMenu(screen.getByText('Name'))

    expect(screen.getByRole('menuitem', { name: 'Sort Descending' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Hide column' })).toBeTruthy()
  })

  it.each(['button', 'context'] as const)(
    'disables unavailable reset actions in the %s header menu',
    (menuType) => {
      render(<TestTable onSortingChange={() => undefined} />)

      if (menuType === 'button') {
        fireEvent.click(screen.getByRole('button', { name: 'Open Name column menu' }))
      } else {
        fireEvent.contextMenu(screen.getByText('Name'))
      }

      expect(
        screen.getByRole('menuitem', { name: 'Reset column order' }).getAttribute('aria-disabled'),
      ).toBe('true')
      expect(
        screen.getByRole('menuitem', { name: 'Reset column width' }).getAttribute('aria-disabled'),
      ).toBe('true')
    },
  )

  it.each(['button', 'context'] as const)(
    'resets only the selected column to its schema-aware initial width from the %s header menu',
    (menuType) => {
      render(
        <TestTable
          columns={[
            {
              accessorKey: 'name',
              column: null,
              id: 'name',
              isSortable: true,
              label: 'Name',
            },
            {
              accessorKey: 'email',
              column: null,
              id: 'email',
              isSortable: true,
              label: 'Email',
            },
          ]}
          data={[{ id: 'row-1', name: 'Ada', email: 'ada@example.com' } as DynamicTableRow]}
          initialColumnSizing={{ name: 420, email: 360 }}
          onSortingChange={() => undefined}
        />,
      )

      const table = screen.getByRole('table', { name: 'People' })
      const renderedColumns = table.querySelectorAll('col')
      const nameColumn = renderedColumns[1]
      const emailColumn = renderedColumns[2]

      expect(nameColumn?.style.width).toBe('420px')
      expect(emailColumn?.style.width).toBe('360px')

      if (menuType === 'button') {
        fireEvent.click(screen.getByRole('button', { name: 'Open Name column menu' }))
      } else {
        fireEvent.contextMenu(screen.getByText('Name'))
      }
      fireEvent.click(screen.getByRole('menuitem', { name: 'Reset column width' }))

      expect(nameColumn?.style.width).toBe('294px')
      expect(emailColumn?.style.width).toBe('360px')
    },
  )

  it.each(['button', 'context'] as const)(
    'resets reordered columns to their definition order from the %s header menu',
    (menuType) => {
      render(
        <TestTable
          columns={[
            {
              accessorKey: 'name',
              column: null,
              id: 'name',
              isSortable: true,
              label: 'Name',
            },
            {
              accessorKey: 'email',
              column: null,
              id: 'email',
              isSortable: true,
              label: 'Email',
            },
          ]}
          data={[{ id: 'row-1', name: 'Ada', email: 'ada@example.com' } as DynamicTableRow]}
          initialColumnOrder={['email', 'name']}
          onSortingChange={() => undefined}
        />,
      )

      const getHeaderLabels = () =>
        screen
          .getAllByRole('columnheader')
          .map((header) => header.textContent)
          .filter((label) => label === 'Name' || label === 'Email')

      expect(getHeaderLabels()).toEqual(['Email', 'Name'])

      if (menuType === 'button') {
        fireEvent.click(screen.getByRole('button', { name: 'Open Email column menu' }))
      } else {
        fireEvent.contextMenu(screen.getByText('Email'))
      }
      fireEvent.click(screen.getByRole('menuitem', { name: 'Reset column order' }))

      expect(getHeaderLabels()).toEqual(['Name', 'Email'])
    },
  )

  it('moves a column through the shared Move submenu', async () => {
    const onColumnMove = vi.fn()
    render(<TestTable onColumnMove={onColumnMove} onSortingChange={() => undefined} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open Name column menu' }))
    const move = screen.getByRole('menuitem', { name: 'Move' })
    fireEvent.keyDown(move, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Move right/ })).toBeTruthy()
    })
    fireEvent.click(screen.getByRole('menuitem', { name: /Move right/ }))

    expect(onColumnMove).toHaveBeenCalledWith('name', 'right')
  })

  it('keeps boundary movement as menu actions without hotkey hints', async () => {
    render(<TestTable onColumnMove={() => undefined} onSortingChange={() => undefined} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open Name column menu' }))
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Move' }), { key: 'ArrowRight' })

    expect(await screen.findByRole('menuitem', { name: 'Move to first column' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Move to last column' })).toBeTruthy()
    expect(screen.queryByLabelText('Ctrl+Shift+ArrowLeft')).toBeNull()
    expect(screen.queryByLabelText('Ctrl+Shift+ArrowRight')).toBeNull()
  })

  it.each([
    {
      ctrlKey: false,
      direction: 'left' as const,
      hotkey: 'Shift+ArrowLeft',
      key: 'ArrowLeft',
      label: /Move left/,
    },
    {
      ctrlKey: false,
      direction: 'right' as const,
      hotkey: 'Shift+ArrowRight',
      key: 'ArrowRight',
      label: /Move right/,
    },
  ])(
    'moves a column $direction with its recorded menu hotkey',
    async ({ ctrlKey, direction, hotkey, key, label }) => {
      const onColumnMove = vi.fn()
      render(<TestTable onColumnMove={onColumnMove} onSortingChange={() => undefined} />)

      fireEvent.click(screen.getByRole('button', { name: 'Open Name column menu' }))
      fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Move' }), { key: 'ArrowRight' })

      const moveItem = await screen.findByRole('menuitem', { name: label })
      expect(screen.getByLabelText(hotkey)).toBeTruthy()
      fireEvent.keyDown(moveItem, { ctrlKey, key, shiftKey: true })

      expect(onColumnMove).toHaveBeenCalledWith('name', direction)
    },
  )

  it('moves a column with the recorded context-menu hotkey', async () => {
    const onColumnMove = vi.fn()
    render(<TestTable onColumnMove={onColumnMove} onSortingChange={() => undefined} />)

    fireEvent.contextMenu(screen.getByText('Name'))
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Move' }), { key: 'ArrowRight' })

    const moveLeft = await screen.findByRole('menuitem', { name: /Move left/ })
    expect(screen.getByLabelText('Shift+ArrowLeft')).toBeTruthy()
    fireEvent.keyDown(moveLeft, { key: 'ArrowLeft', shiftKey: true })

    expect(onColumnMove).toHaveBeenCalledWith('name', 'left')
  })

  it('hides a column through the header action menu', () => {
    render(<TestTable onSortingChange={() => undefined} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open Name column menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide column' }))

    expect(screen.queryByText('Ada')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open Name column menu' })).toBeNull()
  })

  it('renders composed type markers with tooltips without applying ARIA labels to spans', async () => {
    render(
      <TestTable
        columns={[
          { accessorKey: 'id', column: null, id: 'id', isSortable: true, label: 'id' },
          {
            accessorKey: 'accountIds',
            column: {
              column_type: { type: 'Array', element: { type: 'Uuid' } },
              name: 'accountIds',
              nullable: true,
              references: 'accounts',
            } as never,
            id: 'accountIds',
            isSortable: false,
            label: 'Accounts',
          },
        ]}
        onSortingChange={() => undefined}
      />,
    )

    const markers = Array.from(document.querySelectorAll('[data-slot="tooltip-trigger"]'))
    const rowIdMarker = markers[0]
    const referenceMarker = markers[1]

    if (rowIdMarker === undefined || referenceMarker === undefined) {
      throw new Error('Expected column type markers to render tooltip triggers')
    }

    expect(rowIdMarker.getAttribute('aria-label')).toBeNull()
    expect(rowIdMarker.getAttribute('title')).toBeNull()
    expect(
      rowIdMarker.compareDocumentPosition(screen.getByText('id')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(referenceMarker.getAttribute('aria-label')).toBeNull()
    expect(referenceMarker.textContent).toBe('')

    fireEvent.mouseEnter(rowIdMarker)
    fireEvent.mouseMove(rowIdMarker)
    expect(await screen.findByText('Row ID')).toBeTruthy()
  })

  it('uses schema-aware initial column widths', () => {
    const columns = buildDataGridColumns({
      columns: [
        {
          accessorKey: 'id',
          column: null,
          id: 'id',
          isSortable: true,
          label: 'Id',
        },
        {
          accessorKey: 'enabled',
          column: {
            column_type: { type: 'Boolean' },
            name: 'enabled',
          } as never,
          id: 'enabled',
          isSortable: true,
          label: 'Enabled',
        },
        {
          accessorKey: 'metadata',
          column: {
            column_type: { type: 'Json' },
            name: 'metadata',
          } as never,
          id: 'metadata',
          isSortable: false,
          label: 'Metadata',
        },
      ],
    })

    expect(columns.find((column) => column.id === 'id')?.size).toBe(294)
    expect(columns.find((column) => column.id === 'enabled')?.size).toBe(220)
    expect(columns.find((column) => column.id === 'metadata')?.size).toBe(220)
  })

  it('renders the selection header and row cells from one fixed-width column', () => {
    render(<TestTable onSortingChange={() => undefined} />)

    const table = screen.getByRole('table', { name: 'People' })
    const renderedColumns = table.querySelectorAll('col')
    screen.getByRole('checkbox', { name: 'Select all loaded rows' })
    screen.getByRole('checkbox', { name: 'Select row row-1' })

    expect(renderedColumns).toHaveLength(2)
    expect(renderedColumns[0]?.style.width).toBe('36px')
  })

  it('keeps the internal selection column distinct from inspected schema columns', () => {
    const columns = buildDataGridColumns({
      columns: [
        {
          accessorKey: '_select',
          column: null,
          id: '_select',
          isSortable: true,
          label: '_select',
        },
      ],
    })
    const columnIds = columns.map((column) => column.id)

    expect(new Set(columnIds).size).toBe(columnIds.length)
    expect(columnIds).toContain('_select')
  })

  it('selects an inclusive row range through TanStack Shift handling', () => {
    render(
      <TestTable
        data={[
          { id: 'row-1', name: 'Ada' } as DynamicTableRow,
          { id: 'row-2', name: 'Grace' } as DynamicTableRow,
          { id: 'row-3', name: 'Linus' } as DynamicTableRow,
        ]}
        onSortingChange={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-1' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row row-3' }), {
      shiftKey: true,
    })

    expect(
      screen.getByRole('checkbox', { name: 'Select row row-1' }).getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      screen.getByRole('checkbox', { name: 'Select row row-2' }).getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      screen.getByRole('checkbox', { name: 'Select row row-3' }).getAttribute('aria-checked'),
    ).toBe('true')
  })

  it('renders explicit compact primitive states and aligns numbers', () => {
    render(
      <TestTable
        columns={[
          {
            accessorKey: 'empty',
            column: { column_type: { type: 'Text' }, name: 'empty', nullable: false } as never,
            id: 'empty',
            isSortable: true,
            label: 'Empty',
          },
          {
            accessorKey: 'missing',
            column: { column_type: { type: 'Text' }, name: 'missing', nullable: true } as never,
            id: 'missing',
            isSortable: true,
            label: 'Missing',
          },
          {
            accessorKey: 'count',
            column: { column_type: { type: 'Integer' }, name: 'count', nullable: false } as never,
            id: 'count',
            isSortable: true,
            label: 'Count',
          },
          {
            accessorKey: 'enabled',
            column: { column_type: { type: 'Boolean' }, name: 'enabled', nullable: false } as never,
            id: 'enabled',
            isSortable: true,
            label: 'Enabled',
          },
        ]}
        data={[
          { id: 'row-1', empty: '', missing: null, count: 42, enabled: false } as DynamicTableRow,
        ]}
        onSortingChange={() => undefined}
      />,
    )

    expect(screen.getByText('""')).toBeTruthy()
    expect(screen.getByText('NULL')).toBeTruthy()
    expect(screen.getByText('42').getAttribute('data-cell-alignment')).toBe('end')
    expect(screen.getByText('false')).toBeTruthy()
    expect(screen.getByLabelText('Boolean false')).toBeTruthy()
  })

  it('renders row IDs with middle truncation', () => {
    const id = 'row_0123456789abcdefghijklmnopqrstuvwxyz'
    render(
      <TestTable
        columns={[{ accessorKey: 'id', column: null, id: 'id', isSortable: true, label: 'id' }]}
        data={[{ id } as DynamicTableRow]}
        onSortingChange={() => undefined}
      />,
    )

    const idValue = screen.getByText(id).closest('[data-cell-overflow="middle-truncate"]')
    expect(idValue?.querySelector('[data-slot="middle-truncate"]')).toBeTruthy()
  })

  it('uses monospace typography for raw values while retaining tabular numbers', () => {
    const rowId = 'row_0123456789abcdef'
    const uuid = '03c905ac-d9a6-58b8-8d90-5dc3b9df6038'
    render(
      <TestTable
        columns={[
          { accessorKey: 'id', column: null, id: 'id', isSortable: true, label: 'Id' },
          {
            accessorKey: 'sessionId',
            column: { column_type: { type: 'Uuid' }, name: 'sessionId', nullable: false } as never,
            id: 'sessionId',
            isSortable: true,
            label: 'Session ID',
          },
          {
            accessorKey: 'name',
            column: { column_type: { type: 'Text' }, name: 'name', nullable: false } as never,
            id: 'name',
            isSortable: true,
            label: 'Name',
          },
          {
            accessorKey: 'role',
            column: {
              column_type: { type: 'Enum', variants: ['admin'] },
              name: 'role',
              nullable: false,
            } as never,
            id: 'role',
            isSortable: true,
            label: 'Role',
          },
          {
            accessorKey: 'count',
            column: { column_type: { type: 'Integer' }, name: 'count', nullable: false } as never,
            id: 'count',
            isSortable: true,
            label: 'Count',
          },
        ]}
        data={[
          {
            id: rowId,
            sessionId: uuid,
            name: 'Ada',
            role: 'admin',
            count: 1203,
          } as DynamicTableRow,
        ]}
        onSortingChange={() => undefined}
      />,
    )

    expect(screen.getByText(rowId).closest('[data-cell-typography="mono"]')).toBeTruthy()
    expect(screen.getByText(uuid).getAttribute('data-cell-typography')).toBe('mono')
    expect(screen.getByText('Ada').getAttribute('data-cell-typography')).toBe('mono')
    expect(screen.getByText('admin').getAttribute('data-cell-typography')).toBe('mono')
    const numericValue = screen.getByText('1203')
    expect(numericValue.getAttribute('data-cell-typography')).toBe('mono')
    expect(numericValue.getAttribute('data-numeric-variant')).toBe('tabular')
  })

  it('renders bounded structured and binary previews', () => {
    render(
      <TestTable
        columns={[
          {
            accessorKey: 'payload',
            column: { column_type: { type: 'Bytea' }, name: 'payload', nullable: false } as never,
            id: 'payload',
            isSortable: false,
            label: 'Payload',
          },
          {
            accessorKey: 'tags',
            column: {
              column_type: { type: 'Array', element: { type: 'Text' } },
              name: 'tags',
              nullable: false,
            } as never,
            id: 'tags',
            isSortable: false,
            label: 'Tags',
          },
        ]}
        data={[
          {
            id: 'row-1',
            payload: new Uint8Array(317),
            tags: ['reader', 'writer', 'reader', 'owner'],
          } as DynamicTableRow,
        ]}
        onSortingChange={() => undefined}
      />,
    )

    expect(screen.getByText('317B')).toBeTruthy()
    expect(screen.getByText('[4]')).toBeTruthy()
    expect(screen.getByText(/^"reader", "writer", "reader"/)).toBeTruthy()
    expect(screen.queryByText(/0,0,0/)).toBeNull()
    expect(screen.getByText('317B').closest('[title]')).toBeNull()
    expect(screen.getByText(/reader/).closest('[title]')).toBeNull()
  })

  it('renders timestamp and shallow structured values without traversing nested containers', () => {
    const timestamp = new Date('2026-07-27T14:03:04.987Z')
    let nestedReads = 0
    const nested = {}
    Object.defineProperty(nested, 'secret', {
      enumerable: true,
      get: () => {
        nestedReads += 1
        return new Uint8Array([1, 2, 3])
      },
    })
    const circular: Record<string, unknown> = { enabled: true, nested }
    circular.self = circular

    render(
      <TestTable
        columns={[
          {
            accessorKey: 'createdAt',
            column: { column_type: { type: 'Timestamp' }, name: 'createdAt' } as never,
            id: 'createdAt',
            isSortable: true,
            label: 'Created at',
          },
          {
            accessorKey: 'metadata',
            column: { column_type: { type: 'Json', schema: {} }, name: 'metadata' } as never,
            id: 'metadata',
            isSortable: false,
            label: 'Metadata',
          },
        ]}
        data={[{ id: 'row-1', createdAt: timestamp, metadata: circular } as DynamicTableRow]}
        onSortingChange={() => undefined}
      />,
    )

    expect(
      screen.getByText(
        new Intl.DateTimeFormat(undefined, {
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          month: 'short',
          second: '2-digit',
          year: 'numeric',
        }).format(timestamp),
      ).tagName,
    ).toBe('TIME')
    expect(screen.getByLabelText('Typed JSON value')).toBeTruthy()
    expect(screen.getByText(/enabled: true/).closest('code')).toBeTruthy()
    expect(nestedReads).toBe(0)
  })
})
