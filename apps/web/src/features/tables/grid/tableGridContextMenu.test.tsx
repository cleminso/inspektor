import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { MouseEvent, ReactElement, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TableGridContextMenu } from '@tables/grid/tableGridContextMenu'

vi.mock('@inspector/ds', () => {
  const Root = ({ children }: { children: ReactNode }) => (
    <div data-testid="menu-root">{children}</div>
  )
  const Trigger = ({ render }: { render: ReactElement }) => render
  const Content = ({ children }: { children: ReactNode }) => <div role="menu">{children}</div>
  const Item = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button role="menuitem" type="button" onClick={onClick}>
      {children}
    </button>
  )
  const Separator = () => <hr />

  return { ContextMenu: Object.assign(Root, { Root, Trigger, Content, Item, Separator }) }
})

afterEach(cleanup)

function renderMenu({
  deletedRowIds = new Set<string>(),
  stagedFieldsByRowId = { 'row-1': new Set(['name', 'settings']) },
} = {}) {
  const revertField = vi.fn()
  const revertRowUpdate = vi.fn()

  render(
    <TableGridContextMenu
      stagedDeletionRowIds={deletedRowIds}
      stagedFieldsByRowId={stagedFieldsByRowId}
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

  return { revertField, revertRowUpdate }
}

describe('TableGridContextMenu', () => {
  it('mounts one root and offers cell scope before row scope for a staged data cell', () => {
    renderMenu()

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Name cell' }))

    expect(screen.getAllByTestId('menu-root')).toHaveLength(1)
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Revert this change',
      'Revert staged changes',
    ])
  })

  it('reverts the semantic cell target and restores focus to its captured currentTarget', () => {
    const { revertField } = renderMenu()
    const cell = screen.getByRole('button', { name: 'Name cell' })

    fireEvent.contextMenu(cell)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Revert this change' }))

    expect(revertField).toHaveBeenCalledWith('row-1', 'name')
    expect(document.activeElement).toBe(cell)
  })

  it('offers only row recovery for an unstaged sibling and restores the row target after recovery', () => {
    const { revertRowUpdate } = renderMenu()
    const cell = screen.getByRole('button', { name: 'Email cell' })

    fireEvent.contextMenu(cell)
    expect(screen.queryByRole('menuitem', { name: 'Revert this change' })).toBeNull()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Revert staged changes' }))

    expect(revertRowUpdate).toHaveBeenCalledWith('row-1')
    expect(document.activeElement).toBe(cell)
  })

  it('uses row callbacks as canonical row targets', () => {
    const { revertRowUpdate } = renderMenu()
    const rowTarget = screen.getByRole('button', { name: 'Row target' })

    fireEvent.contextMenu(rowTarget)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Revert staged changes' }))

    expect(revertRowUpdate).toHaveBeenCalledWith('row-1')
    expect(document.activeElement).toBe(rowTarget)
  })

  it('suppresses recovery for selection cells and staged-deletion rows', () => {
    const { rerender } = render(
      <TableGridContextMenu
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
