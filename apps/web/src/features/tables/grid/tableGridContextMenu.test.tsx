import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { MouseEvent, ReactElement, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TableGridContextMenu } from '@tables/grid/tableGridContextMenu'

vi.mock('@inspector/ds', () => {
  const Root = ({ children }: { children: ReactNode }) => (
    <div data-testid="menu-root">{children}</div>
  )
  const Trigger = ({
    render,
  }: {
    render: ReactElement | ((props: { onContextMenu?: () => void }) => ReactElement)
  }) => (typeof render === 'function' ? render({}) : render)
  const Content = ({ children }: { children: ReactNode }) => <div role="menu">{children}</div>
  const Item = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button role="menuitem" type="button" onClick={onClick}>
      {children}
    </button>
  )
  const Separator = () => <hr />
  const Shortcut = () => <span data-testid="shortcut" />
  const SubmenuRoot = ({ children }: { children: ReactNode }) => <div>{children}</div>
  const SubmenuTrigger = ({ children }: { children: ReactNode }) => (
    <button role="menuitem" type="button">
      {children}
    </button>
  )

  return {
    ContextMenu: Object.assign(Root, {
      Root,
      Trigger,
      Content,
      Item,
      Separator,
      Shortcut,
      SubmenuRoot,
      SubmenuTrigger,
    }),
  }
})

afterEach(cleanup)

function renderMenu({
  actions = {
    canCopy: true,
    canEdit: true,
    canFilterBy: true,
    copyAs: [] as readonly ('hex' | 'base64')[],
  },
  deletedRowIds = new Set<string>(),
  stagedFieldsByRowId = { 'row-1': new Set(['name', 'settings']) },
} = {}) {
  const getCellActions = vi.fn(() => actions)
  const onCopyCell = vi.fn()
  const onEditCell = vi.fn()
  const onFilterByCell = vi.fn()
  const revertField = vi.fn()
  const revertRowUpdate = vi.fn()

  render(
    <TableGridContextMenu
      stagedDeletionRowIds={deletedRowIds}
      stagedFieldsByRowId={stagedFieldsByRowId}
      getCellActions={getCellActions}
      onCopyCell={onCopyCell}
      onEditCell={onEditCell}
      onFilterByCell={onFilterByCell}
      onTouchCellContextMenuOpen={vi.fn()}
      revertField={revertField}
      revertRowUpdate={revertRowUpdate}
    >
      {({ composeViewport, onCellContextMenu, onRowContextMenu }) =>
        composeViewport(
          <div>
            <button
              type="button"
              onContextMenu={(event) =>
                onCellContextMenu(
                  { columnId: 'name', rowId: 'row-1' },
                  event as unknown as MouseEvent<HTMLTableCellElement>,
                )
              }
            >
              Name cell
            </button>
            <button
              type="button"
              onContextMenu={(event) =>
                onCellContextMenu(
                  { columnId: 'email', rowId: 'row-1' },
                  event as unknown as MouseEvent<HTMLTableCellElement>,
                )
              }
            >
              Email cell
            </button>
            <button
              type="button"
              onContextMenu={(event) =>
                onRowContextMenu('row-1', event as unknown as MouseEvent<HTMLTableRowElement>)
              }
            >
              Row target
            </button>
          </div>,
        )
      }
    </TableGridContextMenu>,
  )

  return { onCopyCell, onEditCell, onFilterByCell, revertField, revertRowUpdate }
}

describe('TableGridContextMenu', () => {
  it('mounts one root and offers cell scope before row scope for a staged data cell', () => {
    renderMenu()

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Name cell' }))

    expect(screen.getAllByTestId('menu-root')).toHaveLength(1)
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Edit',
      'Filter by',
      'Copy',
      'Revert this change',
      'Revert staged changes',
    ])
  })

  it('runs edit, filter, and copy against the semantic cell target', () => {
    const { onCopyCell, onEditCell, onFilterByCell } = renderMenu()
    const cell = screen.getByRole('button', { name: 'Name cell' })

    fireEvent.contextMenu(cell)
    screen.getByRole('button', { name: 'Email cell' }).focus()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onEditCell).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Email cell' }))

    fireEvent.contextMenu(cell)
    screen.getByRole('button', { name: 'Email cell' }).focus()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Filter by' }))
    expect(onFilterByCell).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Email cell' }))

    fireEvent.contextMenu(cell)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy' }))
    expect(onCopyCell).toHaveBeenCalledWith({ columnId: 'name', rowId: 'row-1' })
  })

  it('offers binary copy formats as explicit direct actions', () => {
    const { onCopyCell } = renderMenu({
      actions: { canCopy: true, canEdit: false, canFilterBy: false, copyAs: ['hex', 'base64'] },
    })

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Name cell' }))

    expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Filter by' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Copy' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Copy as' })).toBeNull()
    fireEvent.click(screen.getByRole('menuitem', { name: /^Copy as Hex/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy as Base64' }))
    expect(onCopyCell.mock.calls).toEqual([
      [{ columnId: 'name', rowId: 'row-1' }, 'hex'],
      [{ columnId: 'name', rowId: 'row-1' }, 'base64'],
    ])
  })

  it('reverts the semantic cell target', () => {
    const { revertField } = renderMenu()
    const cell = screen.getByRole('button', { name: 'Name cell' })

    fireEvent.contextMenu(cell)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Revert this change' }))

    expect(revertField).toHaveBeenCalledWith('row-1', 'name')
  })

  it('offers only row recovery for an unstaged sibling', () => {
    const { revertRowUpdate } = renderMenu()
    const cell = screen.getByRole('button', { name: 'Email cell' })

    fireEvent.contextMenu(cell)
    expect(screen.queryByRole('menuitem', { name: 'Revert this change' })).toBeNull()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Revert staged changes' }))

    expect(revertRowUpdate).toHaveBeenCalledWith('row-1')
  })

  it('uses row callbacks as canonical row targets', () => {
    const { revertRowUpdate } = renderMenu()
    const rowTarget = screen.getByRole('button', { name: 'Row target' })

    fireEvent.contextMenu(rowTarget)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Revert staged changes' }))

    expect(revertRowUpdate).toHaveBeenCalledWith('row-1')
  })

  it('suppresses recovery for selection cells and staged-deletion rows', () => {
    const { rerender } = render(
      <TableGridContextMenu
        getCellActions={() => ({
          canCopy: false,
          canEdit: false,
          canFilterBy: false,
          copyAs: [],
        })}
        onCopyCell={vi.fn()}
        onEditCell={vi.fn()}
        onFilterByCell={vi.fn()}
        onTouchCellContextMenuOpen={vi.fn()}
        stagedDeletionRowIds={new Set<string>()}
        stagedFieldsByRowId={{ 'row-1': new Set(['\uE000inspector-row-selection']) }}
        revertField={vi.fn()}
        revertRowUpdate={vi.fn()}
      >
        {({ composeViewport, onCellContextMenu }) =>
          composeViewport(
            <button
              type="button"
              onContextMenu={(event) =>
                onCellContextMenu(
                  { columnId: '\uE000inspector-row-selection', rowId: 'row-1' },
                  event as unknown as MouseEvent<HTMLTableCellElement>,
                )
              }
            >
              Selection cell
            </button>,
          )
        }
      </TableGridContextMenu>,
    )

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Selection cell' }))
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)

    rerender(
      <TableGridContextMenu
        getCellActions={() => ({
          canCopy: false,
          canEdit: false,
          canFilterBy: false,
          copyAs: [],
        })}
        onCopyCell={vi.fn()}
        onEditCell={vi.fn()}
        onFilterByCell={vi.fn()}
        onTouchCellContextMenuOpen={vi.fn()}
        stagedDeletionRowIds={new Set(['row-1'])}
        stagedFieldsByRowId={{ 'row-1': new Set(['name']) }}
        revertField={vi.fn()}
        revertRowUpdate={vi.fn()}
      >
        {({ composeViewport, onCellContextMenu }) =>
          composeViewport(
            <button
              type="button"
              onContextMenu={(event) =>
                onCellContextMenu(
                  { columnId: 'name', rowId: 'row-1' },
                  event as unknown as MouseEvent<HTMLTableCellElement>,
                )
              }
            >
              Deleted cell
            </button>,
          )
        }
      </TableGridContextMenu>,
    )
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Deleted cell' }))
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
  })
})
