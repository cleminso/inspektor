import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TableListPane } from './pane'

const { releasePrefetch, startTableRowsPrefetch } = vi.hoisted(() => ({
  releasePrefetch: vi.fn(),
  startTableRowsPrefetch: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspector: () => ({
    currentBranch: 'main',
    currentConnectionId: 'connection',
    currentSchemaHash: 'schema',
    runtime: {
      client: { manager: {} },
      wasmSchema: { users: { columns: [] } },
    },
  }),
}))

vi.mock('@tables/query/tableRowsPrefetch', () => ({
  TABLE_ROWS_PREFETCH_INTENT_DELAY_MS: 75,
  startTableRowsPrefetch,
}))

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

beforeEach(() => {
  releasePrefetch.mockClear()
  startTableRowsPrefetch.mockReset()
  startTableRowsPrefetch.mockReturnValue(releasePrefetch)
})

describe('TableListPane', () => {
  const defaultActionProps = {
    pinnedTableNames: new Set<string>(),
    onOpenTables: vi.fn(),
    onPinTables: vi.fn(),
    onReplaceSelection: vi.fn(),
    onUnpinTables: vi.fn(),
  }

  it('keeps table overflow inside the expanded accordion panel', () => {
    const { container } = render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts', 'sessions', 'users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    expect(container.querySelector('[data-layout="fill"]')).toBeTruthy()
    expect(
      screen.getByText('accounts').closest('[data-scrollbar="overlay"]')?.getAttribute('data-slot'),
    ).toBe('scroll-area')
  })

  it('delegates bulk table selection to the consumer', () => {
    const onTableCheckedChange = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={onTableCheckedChange}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select accounts' }))

    expect(onTableCheckedChange).toHaveBeenCalledWith('accounts', true, {
      extendRange: false,
      orderedTableNames: ['accounts'],
      section: 'tables',
    })
  })

  it('delegates Shift selection with the visible table order', () => {
    const onTableCheckedChange = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set(['accounts'])}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts', 'sessions', 'users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={onTableCheckedChange}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select users' }), {
      shiftKey: true,
    })

    expect(onTableCheckedChange).toHaveBeenCalledWith('users', true, {
      extendRange: true,
      orderedTableNames: ['accounts', 'sessions', 'users'],
      section: 'tables',
    })
  })

  it('keeps table names as links when bulk selection is inactive', () => {
    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'accounts' }).tagName).toBe('A')
  })

  it('prefetches the destination rows from pointer intent and releases ownership on exit', () => {
    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    const usersLink = screen.getByRole('button', { name: 'users' })
    fireEvent.pointerEnter(usersLink)
    fireEvent.focus(usersLink)

    expect(startTableRowsPrefetch).toHaveBeenCalledOnce()
    expect(startTableRowsPrefetch).toHaveBeenCalledWith({
      client: { manager: {} },
      schema: { users: { columns: [] } },
      tableName: 'users',
    })

    fireEvent.pointerLeave(usersLink)

    expect(releasePrefetch).toHaveBeenCalledOnce()
  })

  it('releases speculative ownership when the destination becomes active', () => {
    const { rerender } = render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.focus(screen.getByRole('button', { name: 'users' }))
    rerender(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName="users"
        tables={['users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    expect(releasePrefetch).toHaveBeenCalledOnce()
  })

  it('does not prefetch table-name buttons while bulk selection is active', () => {
    render(
      <TableListPane
        checkedTableNames={new Set(['accounts'])}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.pointerEnter(screen.getByRole('button', { name: 'users' }))

    expect(startTableRowsPrefetch).not.toHaveBeenCalled()
  })

  it('does not prefetch when pointer intent leaves before settling', () => {
    vi.useFakeTimers()
    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    const usersLink = screen.getByRole('button', { name: 'users' })
    fireEvent.pointerEnter(usersLink)
    fireEvent.pointerLeave(usersLink)
    vi.runAllTimers()

    expect(startTableRowsPrefetch).not.toHaveBeenCalled()
  })

  it('uses table names to extend checkbox selection while bulk selection is active', () => {
    const onTableCheckedChange = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set(['accounts'])}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts', 'sessions', 'users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={onTableCheckedChange}
      />,
    )

    const usersTrigger = screen.getByRole('button', { name: 'users' })
    expect(usersTrigger.tagName).toBe('BUTTON')
    fireEvent.click(usersTrigger, { shiftKey: true })

    expect(onTableCheckedChange).toHaveBeenCalledWith('users', true, {
      extendRange: true,
      orderedTableNames: ['accounts', 'sessions', 'users'],
      section: 'tables',
    })
  })

  it('uses a checked table name to deselect that table', () => {
    const onTableCheckedChange = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set(['accounts'])}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={onTableCheckedChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'accounts' }))

    expect(onTableCheckedChange).toHaveBeenCalledWith('accounts', false, {
      extendRange: false,
      orderedTableNames: ['accounts', 'users'],
      section: 'tables',
    })
  })

  it('clears checked tables when clicking outside the table list', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set(['accounts'])}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.pointerDown(document.body)

    expect(onClearSelection).toHaveBeenCalledOnce()
  })

  it('preserves checked tables when clicking another table name', () => {
    const onClearSelection = vi.fn()
    const onTableCheckedChange = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set(['accounts'])}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={onTableCheckedChange}
      />,
    )

    const usersTrigger = screen.getByRole('button', { name: 'users' })
    fireEvent.pointerDown(usersTrigger)
    fireEvent.click(usersTrigger)

    expect(onClearSelection).not.toHaveBeenCalled()
    expect(onTableCheckedChange).toHaveBeenCalledWith('users', true, {
      extendRange: false,
      orderedTableNames: ['accounts', 'users'],
      section: 'tables',
    })
  })

  it('clears a non-empty selection with Escape from the list', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set(['accounts'])}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Select accounts' }), {
      key: 'Escape',
    })

    expect(onClearSelection).toHaveBeenCalledOnce()
  })

  it('ignores Escape when no tables are checked', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Select accounts' }), {
      key: 'Escape',
    })

    expect(onClearSelection).not.toHaveBeenCalled()
  })

  it('moves pinned tables into a separate section', () => {
    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set()}
        pinnedTableNames={new Set(['users'])}
        selectedTableName={null}
        tables={['accounts', 'sessions', 'users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /PINNED/ }).textContent).toContain('1')
    expect(screen.getByRole('button', { name: /TABLES/ }).textContent).toContain('2')
    expect(screen.getAllByText('users')).toHaveLength(1)
  })

  it('keeps the pinned and tables sections expanded together', () => {
    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set()}
        pinnedTableNames={new Set(['users'])}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    )

    const pinnedTrigger = screen.getByRole('button', { name: /PINNED/ })
    const tablesTrigger = screen.getByRole('button', { name: /TABLES/ })

    fireEvent.click(pinnedTrigger)
    fireEvent.click(pinnedTrigger)

    expect(pinnedTrigger.getAttribute('aria-expanded')).toBe('true')
    expect(tablesTrigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('replaces selection when right-clicking an unselected table', () => {
    const onReplaceSelection = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(['accounts'])}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={vi.fn()}
        onReplaceSelection={onReplaceSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByText('users'), { clientX: 40, clientY: 60 })

    expect(onReplaceSelection).toHaveBeenCalledWith('users', 'tables')
  })

  it('opens selected table actions when right-clicking its checkbox', () => {
    const onReplaceSelection = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(['accounts'])}
        selectedTableName={null}
        tables={['accounts', 'users']}
        onClearSelection={vi.fn()}
        onReplaceSelection={onReplaceSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByRole('checkbox', { name: 'Select accounts' }), {
      clientX: 40,
      clientY: 60,
    })

    expect(onReplaceSelection).not.toHaveBeenCalled()
    expect(screen.getByRole('menuitem', { name: 'Open 1 table' })).toBeTruthy()
  })

  it('clears checked tables when the context menu is dismissed', () => {
    const onClearSelection = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(['accounts'])}
        selectedTableName={null}
        tables={['accounts']}
        onClearSelection={onClearSelection}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByText('accounts'), { clientX: 40, clientY: 60 })
    fireEvent.pointerDown(document.body)

    expect(onClearSelection).toHaveBeenCalledOnce()
  })

  it('opens all selected tables from the context menu in visible list order', () => {
    const onOpenTables = vi.fn()

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(['accounts', 'users'])}
        selectedTableName={null}
        tables={['accounts', 'sessions', 'users']}
        onClearSelection={vi.fn()}
        onOpenTables={onOpenTables}
        onTableCheckedChange={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByText('accounts'), { clientX: 40, clientY: 60 })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open 2 tables' }))

    expect(onOpenTables).toHaveBeenCalledWith(['accounts', 'users'])
  })
})
