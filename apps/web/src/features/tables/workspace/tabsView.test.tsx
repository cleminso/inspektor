import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TableTabsView } from '@tables/workspace/tabsView'

const mocks = vi.hoisted(() => ({
  activateTab: vi.fn(),
  goBack: vi.fn(),
  goForward: vi.fn(),
  closeTab: vi.fn(),
  openNewView: vi.fn(),
  persistTab: vi.fn(),
  reorderTabs: vi.fn(),
  retryRuntime: vi.fn(),
  releasePrefetch: vi.fn(),
  startTableRowsPrefetch: vi.fn(),
  state: {
    activeTabId: null as string | null,
    replaceableTabId: null as string | null,
    canGoBack: false,
    canGoForward: false,
    runtimeError: null as { source: 'client' | 'schema'; error: Error } | null,
    tabs: [] as Array<
      | { kind: 'newView'; id: 'new-view' }
      | { kind: 'table'; id: string; tableName: string; search: Record<string, number | string> }
    >,
  },
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useRuntimeClient: () => ({ manager: {} }),
  useRuntimeError: () => mocks.state.runtimeError,
  useRuntimeRetry: () => mocks.retryRuntime,
  useRuntimeSchema: () => ({
    accounts: { columns: [] },
    profiles: { columns: [] },
  }),
}))

vi.mock('@tables/query/tableRowsPrefetch', () => ({
  TABLE_ROWS_PREFETCH_INTENT_DELAY_MS: 75,
  startTableRowsPrefetch: mocks.startTableRowsPrefetch,
}))

vi.mock('@tables/workspace/newView', () => ({
  NewTableView: () => <div>New table view content</div>,
}))

vi.mock('@tables/workspace/selectedView', () => ({
  SelectedTableView: ({ tableName }: { tableName: string }) => (
    <div>Selected table: {tableName}</div>
  ),
}))

vi.mock('@tables/workspace/tabsProvider', () => ({
  useTableTabs: () => ({
    activeTabId: mocks.state.activeTabId,
    activateTab: mocks.activateTab,
    closeTab: mocks.closeTab,
    openNewView: mocks.openNewView,
    persistTab: mocks.persistTab,
    replaceableTabId: mocks.state.replaceableTabId,
    reorderTabs: mocks.reorderTabs,
    tabs: mocks.state.tabs,
  }),
}))

vi.mock('@tables/workspace/navigationHistory', () => ({
  useTableNavigationControls: () => ({
    canGoBack: mocks.state.canGoBack,
    canGoForward: mocks.state.canGoForward,
    goBack: mocks.goBack,
    goForward: mocks.goForward,
  }),
}))

afterEach(cleanup)

beforeEach(() => {
  mocks.activateTab.mockReset()
  mocks.goBack.mockReset()
  mocks.goForward.mockReset()
  mocks.closeTab.mockReset()
  mocks.openNewView.mockReset()
  mocks.persistTab.mockReset()
  mocks.reorderTabs.mockReset()
  mocks.retryRuntime.mockReset()
  mocks.releasePrefetch.mockReset()
  mocks.startTableRowsPrefetch.mockReset()
  mocks.startTableRowsPrefetch.mockReturnValue(mocks.releasePrefetch)
  mocks.state.activeTabId = null
  mocks.state.replaceableTabId = null
  mocks.state.canGoBack = false
  mocks.state.canGoForward = false
  mocks.state.runtimeError = null
  mocks.state.tabs = []
})

it('shows safe runtime recovery with or without a selected table', () => {
  mocks.state.runtimeError = { source: 'schema', error: new Error('Runtime failed') }

  const { rerender } = render(<TableTabsView tableName={null} />)

  const alert = screen.getByRole('alert')
  expect(alert.textContent).toContain("Couldn't initialize the Inspector")
  expect(alert.textContent).not.toContain('Runtime failed')
  expect(screen.queryByText('New table view content')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(mocks.retryRuntime).toHaveBeenCalledOnce()

  mocks.state.activeTabId = 'table:accounts'
  mocks.state.tabs = [{ kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} }]
  rerender(<TableTabsView tableName="accounts" />)

  expect(screen.getByRole('alert')).toBeTruthy()
  expect(screen.queryByText('Selected table: accounts')).toBeNull()
})

describe('TableTabsView', () => {
  it('hides transient new-view controls and content while initial selection settles', () => {
    mocks.state.activeTabId = 'new-view'
    mocks.state.tabs = [{ kind: 'newView', id: 'new-view' }]

    const { container, rerender } = render(
      <TableTabsView connectionEntryPending tableName={null} />,
    )

    expect(screen.queryByRole('status')).toBeNull()
    expect(container.querySelector('[data-slot="table-workspace-bar-placeholder"]')).toBeTruthy()
    expect(screen.queryByRole('tab', { name: 'New view' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'New view' })).toBeNull()
    expect(screen.queryByText('New table view content')).toBeNull()

    rerender(<TableTabsView connectionEntryPending={false} tableName={null} />)
    expect(container.querySelector('[data-slot="table-workspace-bar-placeholder"]')).toBeNull()
    expect(screen.getByRole('tab', { name: 'New view' })).toBeTruthy()
    expect(screen.getByText('New table view content')).toBeTruthy()
  })

  it('keeps the workspace quiet while route and active-tab identities reconcile', () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: {},
      },
    ]

    render(<TableTabsView tableName="profiles" />)

    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByText('Selected table: profiles')).toBeNull()
  })

  it('does not flash the new view while a table route reconciles', () => {
    mocks.state.activeTabId = 'new-view'
    mocks.state.tabs = [{ kind: 'newView', id: 'new-view' }]

    render(<TableTabsView tableName="profiles" />)

    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByText('New table view content')).toBeNull()
  })

  it('waits for data and schema tab identities to reconcile', () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [{ kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} }]

    render(<TableTabsView tableName="accounts" view="schema" />)

    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByText('Selected table: accounts')).toBeNull()
  })

  it('keeps the new view visible while a cleared route reconciles', () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [{ kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} }]

    render(<TableTabsView tableName={null} />)

    expect(screen.getByText('New table view content')).toBeTruthy()
    expect(screen.queryByText('Selected table:')).toBeNull()
  })

  it('exposes discoverable disabled Tables navigation controls at the history boundary', () => {
    render(<TableTabsView tableName={null} />)

    const backButton = screen.getByRole('button', { name: 'Go Back' })
    const forwardButton = screen.getByRole('button', { name: 'Go Forward' })
    expect(backButton.getAttribute('aria-disabled')).toBe('true')
    expect(forwardButton.getAttribute('aria-disabled')).toBe('true')
    expect(backButton.tabIndex).toBe(0)
    expect(forwardButton.tabIndex).toBe(0)
  })

  it('moves through Tables navigation history', () => {
    mocks.state.canGoBack = true
    mocks.state.canGoForward = true

    render(<TableTabsView tableName={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go Back' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go Forward' }))

    expect(mocks.goBack).toHaveBeenCalledOnce()
    expect(mocks.goForward).toHaveBeenCalledOnce()
  })

  it('shows authored tooltips for available Tables navigation', async () => {
    mocks.state.canGoBack = true
    mocks.state.canGoForward = true

    render(<TableTabsView tableName={null} />)
    const backButton = screen.getByRole('button', { name: 'Go Back' })
    fireEvent.mouseEnter(backButton)
    fireEvent.mouseMove(backButton)

    expect(await screen.findByText('Go Back')).toBeTruthy()
    expect(
      [...document.querySelectorAll('[data-slot="keyboard-input"]')].some((shortcut) =>
        shortcut.textContent?.includes('['),
      ),
    ).toBe(true)

    fireEvent.mouseLeave(backButton)
    const forwardButton = screen.getByRole('button', { name: 'Go Forward' })
    fireEvent.mouseEnter(forwardButton)
    fireEvent.mouseMove(forwardButton)

    expect(await screen.findByText('Go Forward')).toBeTruthy()
    expect(
      [...document.querySelectorAll('[data-slot="keyboard-input"]')].some((shortcut) =>
        shortcut.textContent?.includes(']'),
      ),
    ).toBe(true)
  })

  it('shows authored tooltips for unavailable Tables navigation', async () => {
    render(<TableTabsView tableName={null} />)
    const backButton = screen.getByRole('button', { name: 'Go Back' })
    fireEvent.focus(backButton)

    expect(await screen.findByText('Go Back')).toBeTruthy()
  })

  it('keeps the tab bar visible with an authored new-view tooltip', async () => {
    render(<TableTabsView tableName={null} />)

    const addButton = screen.getByRole('button', { name: 'New view' })
    expect(addButton.getAttribute('title')).toBeNull()
    expect(screen.getByRole('tablist', { name: 'Open table views' })).toBeTruthy()
    expect(screen.getByText('New table view content')).toBeTruthy()

    fireEvent.mouseEnter(addButton)
    fireEvent.mouseMove(addButton)
    expect(await screen.findByText('New view')).toBeTruthy()
    expect(
      [...document.querySelectorAll('[data-slot="keyboard-input"]')].some((shortcut) =>
        shortcut.textContent?.includes('N'),
      ),
    ).toBe(true)

    fireEvent.click(addButton)
    expect(mocks.openNewView).toHaveBeenCalledOnce()
  })

  it('shows the close-view hotkey in a table tab tooltip', async () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: {},
      },
    ]

    render(<TableTabsView tableName="accounts" />)
    const closeButton = screen.getByRole('button', { name: 'Close accounts' })
    fireEvent.mouseEnter(closeButton)
    fireEvent.mouseMove(closeButton)

    expect(await screen.findByText('Close view')).toBeTruthy()
    expect(screen.getByLabelText('Alt+W')).toBeTruthy()
  })

  it('renders table content only for an active table tab', () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: {},
      },
    ]

    render(<TableTabsView tableName="accounts" />)

    expect(screen.getByText('Selected table: accounts')).toBeTruthy()
    expect(screen.queryByText('New table view content')).toBeNull()
  })

  it('uses the table name for schema and filtered data tabs', () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: {},
      },
      {
        kind: 'table',
        id: 'schema:profiles',
        tableName: 'profiles',
        search: { view: 'schema' },
      },
      {
        kind: 'table',
        id: 'table:profiles',
        tableName: 'profiles',
        search: { filters: 'active' },
      },
    ]

    render(<TableTabsView tableName="accounts" />)

    const profilesTabs = screen.getAllByRole('tab', { name: 'profiles' })
    expect(profilesTabs).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Close profiles' })).toHaveLength(2)
  })

  it('keeps a replaceable table open from double click or its context menu', async () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.replaceableTabId = 'table:accounts'
    mocks.state.tabs = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: {},
      },
    ]

    render(<TableTabsView tableName="accounts" />)

    const accountsTab = screen.getByRole('tab', { name: 'accounts' })
    fireEvent.doubleClick(accountsTab)
    expect(mocks.persistTab).toHaveBeenCalledWith('table:accounts')

    mocks.persistTab.mockClear()
    fireEvent.contextMenu(accountsTab, { clientX: 40, clientY: 20 })
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Keep open' }))
    expect(mocks.persistTab).toHaveBeenCalledWith('table:accounts')
  })

  it('does not offer to close the sole new-view tab', () => {
    mocks.state.activeTabId = 'new-view'
    mocks.state.tabs = [{ kind: 'newView', id: 'new-view' }]

    render(<TableTabsView tableName={null} />)

    expect(screen.getByRole('tab', { name: 'New view' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Close New view' })).toBeNull()
  })

  it('moves a table tab from its right-click reorder context menu', async () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: {},
      },
      {
        kind: 'table',
        id: 'table:profiles',
        tableName: 'profiles',
        search: {},
      },
    ]

    render(<TableTabsView tableName="accounts" />)

    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: 'accounts' }).closest('[data-reorder-ready]'),
      ).toBeTruthy()
    })
    const accountsTab = screen.getByRole('tab', { name: 'accounts' })
    fireEvent.contextMenu(accountsTab, { clientX: 40, clientY: 20 })
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Move right' }))

    expect(mocks.reorderTabs).toHaveBeenCalledWith(['table:profiles', 'table:accounts'])
  })

  it("prefetches an inactive tab's exact row query from keyboard intent", () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: {},
      },
      {
        kind: 'table',
        id: 'table:profiles',
        tableName: 'profiles',
        search: {
          dir: 'desc',
          filters: JSON.stringify([
            {
              id: 'filter-1',
              column: 'name',
              operator: 'contains',
              value: 'Ada',
            },
          ]),
          page: 2,
          pageSize: 500,
          sort: 'name',
        },
      },
    ]

    render(<TableTabsView tableName="accounts" />)

    const profilesTab = screen.getByRole('tab', { name: 'profiles' })
    fireEvent.focus(profilesTab)

    expect(mocks.startTableRowsPrefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [
          {
            id: 'filter-1',
            column: 'name',
            operator: 'contains',
            value: 'Ada',
          },
        ],
        page: 2,
        pageSize: 500,
        sortColumn: 'name',
        sortDirection: 'desc',
        tableName: 'profiles',
      }),
    )

    fireEvent.blur(profilesTab)
    expect(mocks.releasePrefetch).toHaveBeenCalledOnce()
  })

  it('ignores transient pointer passes over inactive tabs', () => {
    vi.useFakeTimers()
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: {},
      },
      {
        kind: 'table',
        id: 'table:profiles',
        tableName: 'profiles',
        search: {},
      },
    ]

    try {
      render(<TableTabsView tableName="accounts" />)
      const profilesTab = screen.getByRole('tab', { name: 'profiles' })

      fireEvent.pointerEnter(profilesTab)
      fireEvent.pointerLeave(profilesTab)
      vi.runAllTimers()

      expect(mocks.startTableRowsPrefetch).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('prefetches after pointer intent settles and releases when intent ends', () => {
    vi.useFakeTimers()
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: {},
      },
      {
        kind: 'table',
        id: 'table:profiles',
        tableName: 'profiles',
        search: {},
      },
    ]

    try {
      render(<TableTabsView tableName="accounts" />)
      const profilesTab = screen.getByRole('tab', { name: 'profiles' })

      fireEvent.pointerEnter(profilesTab)
      vi.advanceTimersByTime(75)

      expect(mocks.startTableRowsPrefetch).toHaveBeenCalledOnce()

      fireEvent.pointerLeave(profilesTab)
      expect(mocks.releasePrefetch).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })
})
