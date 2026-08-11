import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TableTabsView } from '@tables/workspace/tabsView'

const mocks = vi.hoisted(() => ({
  activateTab: vi.fn(),
  closeTab: vi.fn(),
  openNewView: vi.fn(),
  reorderTabs: vi.fn(),
  releasePrefetch: vi.fn(),
  startTableRowsPrefetch: vi.fn(),
  state: {
    activeTabId: null as string | null,
    tabs: [] as Array<
      | { kind: 'newView'; id: 'new-view' }
      | { kind: 'table'; id: string; tableName: string; search: Record<string, number | string> }
    >,
  },
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useRuntimeClient: () => ({ manager: {} }),
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
    reorderTabs: mocks.reorderTabs,
    tabs: mocks.state.tabs,
  }),
}))

afterEach(cleanup)

beforeEach(() => {
  mocks.activateTab.mockReset()
  mocks.closeTab.mockReset()
  mocks.openNewView.mockReset()
  mocks.reorderTabs.mockReset()
  mocks.releasePrefetch.mockReset()
  mocks.startTableRowsPrefetch.mockReset()
  mocks.startTableRowsPrefetch.mockReturnValue(mocks.releasePrefetch)
  mocks.state.activeTabId = null
  mocks.state.tabs = []
})

describe('TableTabsView', () => {
  it('keeps the tab bar visible with an authored new-view tooltip', async () => {
    render(<TableTabsView tableName={null} />)

    const addButton = screen.getByRole('button', { name: 'Open new table view' })
    expect(addButton.getAttribute('title')).toBeNull()
    expect(screen.getByRole('tablist', { name: 'Open table views' })).toBeTruthy()
    expect(screen.getByText('New table view content')).toBeTruthy()

    fireEvent.mouseEnter(addButton)
    fireEvent.mouseMove(addButton)
    expect(await screen.findByText('Open new table view')).toBeTruthy()

    fireEvent.click(addButton)
    expect(mocks.openNewView).toHaveBeenCalledOnce()
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

    expect(screen.getByRole('tabpanel').tabIndex).toBe(-1)
    expect(screen.getByText('Selected table: accounts')).toBeTruthy()
    expect(screen.queryByText('New table view content')).toBeNull()
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
        id: 'view:profiles',
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
