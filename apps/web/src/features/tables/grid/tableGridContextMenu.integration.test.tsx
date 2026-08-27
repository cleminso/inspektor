import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createColumnHelper, type CellSelectionState, useTable } from '@tanstack/react-table'
import { useEffect, useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DataGrid,
  dataGridFeatures,
  type BinaryCopyFormat,
  type DataGridCellTarget,
  type DataGridFeatures,
} from '@inspector/ds'
import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'
import { TableGridContextMenu } from '@tables/grid/tableGridContextMenu'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

interface TestRow {
  email: string
  id: string
  name: string
}

const rows: TestRow[] = [{ id: 'row-1', name: 'Ada', email: 'ada@example.com' }]
const columnHelper = createColumnHelper<DataGridFeatures, TestRow>()
const columns = columnHelper.columns([
  columnHelper.display({
    id: tableGridSelectionColumnId,
    cell: () => 'Select',
  }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('email', { header: 'Email' }),
])

function ContextMenuHarness({
  actions,
  binary = false,
  onCopyCell = vi.fn(),
  onEditCell = vi.fn(),
  onFilterByCell = vi.fn(),
  onTouchCellContextMenuOpen = vi.fn(),
  revertField = vi.fn(),
  revertRowUpdate = vi.fn(),
  stagedDeletionRowIds = new Set<string>(),
  stagedFieldsByRowId = {},
}: {
  actions?: {
    canCopy: boolean
    canEdit: boolean
    canFilterBy: boolean
    copyAs: readonly ('hex' | 'base64')[]
  }
  binary?: boolean
  onCopyCell?: (target: DataGridCellTarget, format?: BinaryCopyFormat) => void
  onEditCell?: (target: DataGridCellTarget) => void
  onFilterByCell?: (target: DataGridCellTarget) => void
  onTouchCellContextMenuOpen?: (target: DataGridCellTarget) => void
  revertField?: (rowId: string, fieldName: string) => void
  revertRowUpdate?: (rowId: string) => void
  stagedDeletionRowIds?: ReadonlySet<string>
  stagedFieldsByRowId?: Readonly<Record<string, ReadonlySet<string>>>
}) {
  const [editing, setEditing] = useState(false)
  const [cellSelection, setCellSelection] = useState<CellSelectionState>([])
  const editorRef = useRef<HTMLInputElement>(null)
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (row) => row.id,
    state: { cellSelection },
    onCellSelectionChange: setCellSelection,
  })

  useEffect(() => {
    if (editing === true) {
      editorRef.current?.focus()
    }
  }, [editing])

  return (
    <>
      <TableGridContextMenu
        getCellActions={() => ({
          canCopy: actions?.canCopy ?? true,
          canEdit: actions?.canEdit ?? true,
          canFilterBy: actions?.canFilterBy ?? true,
          copyAs: actions?.copyAs ?? (binary === true ? ['hex', 'base64'] : []),
        })}
        stagedDeletionRowIds={stagedDeletionRowIds}
        stagedFieldsByRowId={stagedFieldsByRowId}
        revertField={revertField}
        revertRowUpdate={revertRowUpdate}
        onCopyCell={onCopyCell}
        onEditCell={(target) => {
          onEditCell(target)
          setEditing(true)
        }}
        onFilterByCell={onFilterByCell}
        onTouchCellContextMenuOpen={onTouchCellContextMenuOpen}
      >
        {({
          composeViewport,
          onCellContextMenu,
          onCellContextMenuTouchStart,
          onRowContextMenu,
          onRowContextMenuTouchStart,
        }) => (
          <DataGrid.Root
            table={table}
            onCellContextMenu={onCellContextMenu}
            onCellContextMenuTouchStart={onCellContextMenuTouchStart}
            onRowContextMenu={onRowContextMenu}
            onRowContextMenuTouchStart={onRowContextMenuTouchStart}
          >
            {composeViewport(
              <DataGrid.Viewport>
                <DataGrid.Table aria-label="People">
                  <DataGrid.Content />
                </DataGrid.Table>
              </DataGrid.Viewport>,
            )}
          </DataGrid.Root>
        )}
      </TableGridContextMenu>
      {editing === true ? <input ref={editorRef} aria-label="Cell editor" /> : null}
    </>
  )
}

describe('TableGridContextMenu integration', () => {
  it('opens through the real context-menu trigger and preserves editor focus after Edit', async () => {
    const onEditCell = vi.fn()
    render(<ContextMenuHarness onEditCell={onEditCell} />)

    expect(fireEvent.contextMenu(screen.getByRole('cell', { name: 'Ada' }))).toBe(false)
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }))

    expect(onEditCell).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' })
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Cell editor' }))
    })
  })

  it('restores cell focus after Filter by', async () => {
    const onFilterByCell = vi.fn()
    render(<ContextMenuHarness onFilterByCell={onFilterByCell} />)
    const cell = screen.getByRole('cell', { name: 'Ada' })
    cell.focus()

    fireEvent.contextMenu(cell)
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Filter by' }))

    expect(onFilterByCell).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' })
    await waitFor(() => {
      expect(document.activeElement).toBe(cell)
    })
  })

  it('restores the trigger focus when the root menu is dismissed with Escape', async () => {
    render(<ContextMenuHarness />)
    const cell = screen.getByRole('cell', { name: 'Ada' })
    cell.focus()

    fireEvent.contextMenu(cell)
    const menu = await screen.findByRole('menu')
    fireEvent.keyDown(menu, { key: 'Escape' })

    await waitFor(() => {
      expect(document.activeElement).toBe(cell)
    })
  })

  it('offers binary copy formats directly without a nested menu', async () => {
    const onCopyCell = vi.fn()
    render(<ContextMenuHarness binary onCopyCell={onCopyCell} />)
    const cell = screen.getByRole('cell', { name: 'Ada' })

    fireEvent.contextMenu(cell)

    expect(await screen.findByRole('menuitem', { name: /^Copy as Hex/ })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Copy as Base64' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Copy' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Copy as' })).toBeNull()
    expect(screen.getAllByRole('menu')).toHaveLength(1)

    fireEvent.click(screen.getByRole('menuitem', { name: /^Copy as Hex/ }))
    fireEvent.contextMenu(cell)
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Copy as Base64' }))
    expect(onCopyCell.mock.calls).toEqual([
      [{ columnId: 'name', rowId: 'row-1' }, 'hex'],
      [{ columnId: 'name', rowId: 'row-1' }, 'base64'],
    ])
  })

  it('offers cell recovery before row recovery for staged fields', async () => {
    const onCopyCell = vi.fn()
    const revertField = vi.fn()
    const revertRowUpdate = vi.fn()
    render(
      <ContextMenuHarness
        onCopyCell={onCopyCell}
        stagedFieldsByRowId={{ 'row-1': new Set(['name', 'settings']) }}
        revertField={revertField}
        revertRowUpdate={revertRowUpdate}
      />,
    )
    const nameCell = screen.getByRole('cell', { name: 'Ada' })

    fireEvent.contextMenu(nameCell)
    expect(
      (await screen.findAllByRole('menuitem')).map((item) =>
        item.textContent?.startsWith('Copy') === true ? 'Copy' : item.textContent,
      ),
    ).toEqual(['Edit', 'Filter by', 'Copy', 'Revert this change', 'Revert staged changes'])
    fireEvent.click(screen.getByRole('menuitem', { name: /^Copy/ }))
    expect(onCopyCell).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' })

    fireEvent.contextMenu(nameCell)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Revert this change' }))
    expect(revertField).toHaveBeenCalledWith('row-1', 'name')

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'ada@example.com' }))
    expect(screen.queryByRole('menuitem', { name: 'Revert this change' })).toBeNull()
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Revert staged changes' }))
    expect(revertRowUpdate).toHaveBeenCalledWith('row-1')

    fireEvent.contextMenu(nameCell.closest('tr') as HTMLTableRowElement)
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Revert staged changes' }))
    expect(revertRowUpdate).toHaveBeenNthCalledWith(2, 'row-1')
  })

  it('suppresses recovery for selection cells and staged-deletion rows', () => {
    const noActions = { canCopy: false, canEdit: false, canFilterBy: false, copyAs: [] } as const
    const view = render(
      <ContextMenuHarness
        actions={noActions}
        stagedFieldsByRowId={{ 'row-1': new Set([tableGridSelectionColumnId]) }}
      />,
    )

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Select' }))
    expect(screen.queryByRole('menu')).toBeNull()

    view.rerender(
      <ContextMenuHarness
        actions={noActions}
        stagedDeletionRowIds={new Set(['row-1'])}
        stagedFieldsByRowId={{ 'row-1': new Set(['name']) }}
      />,
    )
    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Ada' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('does not open the cell menu from a non-row part of the viewport', () => {
    const { container } = render(<ContextMenuHarness />)
    const viewport = container.querySelector<HTMLElement>('[data-slot="data-grid-viewport"]')

    expect(viewport).not.toBeNull()
    if (viewport === null) {
      return
    }

    expect(fireEvent.contextMenu(viewport)).toBe(false)
    expect(screen.queryByRole('menu')).toBeNull()

    expect(fireEvent.contextMenu(screen.getByRole('columnheader', { name: 'Name' }))).toBe(false)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens cell actions from a viewport long press', () => {
    vi.useFakeTimers()
    const onTouchCellContextMenuOpen = vi.fn()
    render(<ContextMenuHarness onTouchCellContextMenuOpen={onTouchCellContextMenuOpen} />)
    const cell = screen.getByRole('cell', { name: 'Ada' })

    fireEvent.touchStart(cell, {
      touches: [{ clientX: 10, clientY: 10 }],
    })
    act(() => vi.advanceTimersByTime(600))

    expect(screen.getByRole('menuitem', { name: /^Copy/ })).toBeTruthy()
    expect(onTouchCellContextMenuOpen).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' })
    expect(document.activeElement).toBe(cell)
  })

  it('does not open an empty menu for a cell without actions', () => {
    render(
      <ContextMenuHarness
        actions={{ canCopy: false, canEdit: false, canFilterBy: false, copyAs: [] }}
      />,
    )

    expect(fireEvent.contextMenu(screen.getByRole('cell', { name: 'Ada' }))).toBe(false)
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
