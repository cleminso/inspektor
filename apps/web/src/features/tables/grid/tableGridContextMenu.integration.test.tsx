import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createColumnHelper, type CellSelectionState, useTable } from '@tanstack/react-table'
import { useEffect, useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DataGrid, dataGridFeatures, type DataGridFeatures } from '@inspector/ds'
import { TableGridContextMenu } from '@tables/grid/tableGridContextMenu'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

interface TestRow {
  id: string
  name: string
}

const rows: TestRow[] = [{ id: 'row-1', name: 'Ada' }]
const columnHelper = createColumnHelper<DataGridFeatures, TestRow>()
const columns = columnHelper.columns([columnHelper.accessor('name', { header: 'Name' })])

function ContextMenuHarness({
  actions,
  binary = false,
  onFilterByCell = vi.fn(),
  onTouchCellContextMenuOpen = vi.fn(),
}: {
  actions?: {
    canCopy: boolean
    canEdit: boolean
    canFilterBy: boolean
    copyAs: readonly ('hex' | 'base64')[]
  }
  binary?: boolean
  onFilterByCell?: () => void
  onTouchCellContextMenuOpen?: (target: { columnId: string; rowId: string }) => void
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
        stagedDeletionRowIds={new Set()}
        stagedFieldsByRowId={{}}
        revertField={vi.fn()}
        revertRowUpdate={vi.fn()}
        onCopyCell={vi.fn()}
        onEditCell={() => setEditing(true)}
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
    render(<ContextMenuHarness />)

    expect(fireEvent.contextMenu(screen.getByRole('cell', { name: 'Ada' }))).toBe(false)
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }))

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

    expect(onFilterByCell).toHaveBeenCalledOnce()
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
    render(<ContextMenuHarness binary />)

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Ada' }))

    expect(await screen.findByRole('menuitem', { name: /^Copy as Hex/ })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Copy as Base64' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Copy as' })).toBeNull()
    expect(screen.getAllByRole('menu')).toHaveLength(1)
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
