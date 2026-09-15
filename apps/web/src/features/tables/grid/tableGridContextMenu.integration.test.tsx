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
} from '@inspektor/ds'
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
  canMutateRow,
  canSelectRow,
  onCopyCell = vi.fn(),
  onEditCell = vi.fn(),
  onFilterByCell = vi.fn(),
  onDeleteRow = vi.fn(),
  onDuplicateRow = vi.fn(),
  onSelectRow = vi.fn(),
  onTouchCellContextMenuOpen = vi.fn(),
  revertField = vi.fn(),
  revertRowUpdate = vi.fn(),
  stagedDeletionRowIds = new Set<string>(),
  stagedFieldsByRowId = {},
}: {
  actions?: {
    canCopy: boolean
    canEdit: boolean
    canExclude: boolean
    canFilterBy: boolean
    copyAs: readonly ('hex' | 'base64')[]
  }
  binary?: boolean
  canMutateRow?: boolean
  canSelectRow?: boolean
  onCopyCell?: (target: DataGridCellTarget, format?: BinaryCopyFormat) => void
  onEditCell?: (target: DataGridCellTarget) => void
  onFilterByCell?: (target: DataGridCellTarget, match: 'include' | 'exclude') => void
  onDeleteRow?: (rowId: string) => void
  onDuplicateRow?: (rowId: string) => void
  onSelectRow?: (rowId: string) => void
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
        canMutateRow={() => canMutateRow ?? stagedDeletionRowIds.has('row-1') === false}
        canSelectRow={() => canSelectRow ?? stagedDeletionRowIds.has('row-1') === false}
        getCellActions={() => ({
          canCopy: actions?.canCopy ?? true,
          canEdit: actions?.canEdit ?? true,
          canExclude: actions?.canExclude ?? true,
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
        onDeleteRow={onDeleteRow}
        onDuplicateRow={onDuplicateRow}
        onSelectRow={onSelectRow}
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
    fireEvent.click(await screen.findByRole('menuitem', { name: /^Edit/ }))

    expect(onEditCell).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' })
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Cell editor' }))
    })
  })

  it('restores cell focus after filtering by the cell value', async () => {
    const onFilterByCell = vi.fn()
    render(<ContextMenuHarness onFilterByCell={onFilterByCell} />)
    const cell = screen.getByRole('cell', { name: 'Ada' })
    cell.focus()

    fireEvent.contextMenu(cell)
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Filter by this value' }))

    expect(onFilterByCell).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' }, 'include')
    await waitFor(() => {
      expect(document.activeElement).toBe(cell)
    })
  })

  it('excludes a cell value and selects an unchecked row from cell and row menus', async () => {
    const onFilterByCell = vi.fn()
    const onSelectRow = vi.fn()
    render(<ContextMenuHarness onFilterByCell={onFilterByCell} onSelectRow={onSelectRow} />)

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Ada' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Exclude this value' }))
    expect(onFilterByCell).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' }, 'exclude')

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Select' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Select row' }))
    expect(onSelectRow).toHaveBeenCalledWith('row-1')

    fireEvent.contextMenu(screen.getByRole('row', { name: /Select Ada/ }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Select row' }))
    expect(onSelectRow).toHaveBeenCalledTimes(2)
  })

  it('duplicates and stages deletion for the targeted row', async () => {
    const onDeleteRow = vi.fn()
    const onDuplicateRow = vi.fn()
    render(<ContextMenuHarness onDeleteRow={onDeleteRow} onDuplicateRow={onDuplicateRow} />)

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Ada' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Duplicate row' }))
    expect(onDuplicateRow).toHaveBeenCalledWith('row-1')

    fireEvent.contextMenu(screen.getByRole('row', { name: /Select Ada/ }))
    const deleteItem = await screen.findByRole('menuitem', { name: 'Delete row' })
    expect(deleteItem.getAttribute('data-variant')).toBe('danger')
    fireEvent.click(deleteItem)
    expect(onDeleteRow).toHaveBeenCalledWith('row-1')
  })

  it('hides Select row when selection is unavailable', () => {
    render(<ContextMenuHarness canSelectRow={false} />)

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Ada' }))

    expect(screen.queryByRole('menuitem', { name: 'Select row' })).toBeNull()
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
    const fieldRecovery = await screen.findByRole('menuitem', { name: 'Discard field change' })
    const rowRecovery = screen.getByRole('menuitem', { name: 'Discard row changes' })
    expect(
      fieldRecovery.compareDocumentPosition(rowRecovery) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    fireEvent.click(screen.getByRole('menuitem', { name: /^Copy/ }))
    expect(onCopyCell).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' })

    fireEvent.contextMenu(nameCell)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Discard field change' }))
    expect(revertField).toHaveBeenCalledWith('row-1', 'name')

    fireEvent.contextMenu(screen.getByRole('cell', { name: 'ada@example.com' }))
    expect(screen.queryByRole('menuitem', { name: 'Discard field change' })).toBeNull()
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Discard row changes' }))
    expect(revertRowUpdate).toHaveBeenCalledWith('row-1')

    fireEvent.contextMenu(nameCell.closest('tr') as HTMLTableRowElement)
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Discard row changes' }))
    expect(revertRowUpdate).toHaveBeenNthCalledWith(2, 'row-1')
  })

  it('suppresses recovery and mutation actions for staged-deletion rows', () => {
    const noActions = {
      canCopy: false,
      canEdit: false,
      canExclude: false,
      canFilterBy: false,
      copyAs: [],
    } as const
    render(
      <ContextMenuHarness
        actions={noActions}
        stagedDeletionRowIds={new Set(['row-1'])}
        stagedFieldsByRowId={{ 'row-1': new Set(['name']) }}
      />,
    )
    fireEvent.contextMenu(screen.getByRole('cell', { name: 'Ada' }))
    expect(screen.queryByRole('menuitem', { name: 'Duplicate row' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Delete row' })).toBeNull()
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
        actions={{
          canCopy: false,
          canEdit: false,
          canExclude: false,
          canFilterBy: false,
          copyAs: [],
        }}
        canMutateRow={false}
        canSelectRow={false}
      />,
    )

    expect(fireEvent.contextMenu(screen.getByRole('cell', { name: 'Ada' }))).toBe(false)
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
