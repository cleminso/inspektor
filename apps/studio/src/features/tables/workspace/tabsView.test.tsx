import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TableTabsView } from '@tables/workspace/tabsView'

const mocks = vi.hoisted(() => ({
  activateTab: vi.fn(),
  closeTab: vi.fn(),
  goBack: vi.fn(),
  goForward: vi.fn(),
  openNewView: vi.fn(),
  persistTab: vi.fn(),
  reorderTabs: vi.fn(),
  retryRuntime: vi.fn(),
  reportConnectionContentReady: vi.fn(),
  state: {
    activeTabId: null as string | null,
    canGoBack: false,
    canGoForward: false,
    replaceableTabId: null as string | null,
    runtimeError: null as { source: 'client' | 'schema'; error: Error } | null,
    tabs: [] as Array<
      | { kind: 'newView'; id: 'new-view' }
      | { kind: 'table'; id: string; tableName: string; search: Record<string, number | string> }
    >,
  },
}))

vi.mock('@app/runtime/connectionContentBoundary', () => ({
  useConnectionContentReady: mocks.reportConnectionContentReady,
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useRuntimeError: () => mocks.state.runtimeError,
  useRuntimeRetry: () => mocks.retryRuntime,
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
  mocks.closeTab.mockReset()
  mocks.goBack.mockReset()
  mocks.goForward.mockReset()
  mocks.openNewView.mockReset()
  mocks.persistTab.mockReset()
  mocks.reorderTabs.mockReset()
  mocks.retryRuntime.mockReset()
  mocks.reportConnectionContentReady.mockReset()
  mocks.state.activeTabId = null
  mocks.state.canGoBack = false
  mocks.state.canGoForward = false
  mocks.state.replaceableTabId = null
  mocks.state.runtimeError = null
  mocks.state.tabs = []
})

it('shows safe runtime recovery with or without a selected table', () => {
  mocks.state.runtimeError = { source: 'schema', error: new Error('Runtime failed') }

  const { rerender } = render(<TableTabsView tableName={null} />)

  const alert = screen.getByRole('alert')
  expect(alert.textContent).toContain('Connection failed')
  expect(alert.textContent).toContain('Check the connection details and try again.')
  expect(alert.textContent).not.toContain("Couldn't initialize Inspektor")
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
  it('reports explicit new views ready without requiring an empty schema', () => {
    mocks.state.activeTabId = 'new-view'
    mocks.state.tabs = [{ kind: 'newView', id: 'new-view' }]

    render(<TableTabsView tableName={null} />)

    expect(mocks.reportConnectionContentReady).toHaveBeenCalledWith(true)
  })

  it('reports reconciled schema views ready', () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.tabs = [
      {
        kind: 'table',
        id: 'table:accounts',
        tableName: 'accounts',
        search: { view: 'schema' },
      },
    ]

    render(<TableTabsView tableName="accounts" view="schema" />)

    expect(mocks.reportConnectionContentReady).toHaveBeenCalledWith(true)
  })

  it('leaves data-view readiness to the authoritative rows query', () => {
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

    expect(mocks.reportConnectionContentReady).toHaveBeenCalledWith(false)
    expect(screen.getByText('Selected table: accounts')).toBeTruthy()
  })

  it('keeps workspace controls visible while schema-dependent content loads', () => {
    mocks.state.activeTabId = 'new-view'
    mocks.state.tabs = [{ kind: 'newView', id: 'new-view' }]

    const { rerender } = render(<TableTabsView connectionEntryPending tableName={null} />)

    expect(screen.getByRole('status').textContent).toContain('Loading schema…')
    expect(screen.getByRole('tab', { name: 'New view' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New view' })).toBeTruthy()
    expect(screen.queryByText('New table view content')).toBeNull()

    rerender(<TableTabsView connectionEntryPending={false} tableName={null} />)
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

    const backButton = screen.getByRole('button', { name: 'Go back' })
    const forwardButton = screen.getByRole('button', { name: 'Go forward' })
    expect(backButton.getAttribute('aria-disabled')).toBe('true')
    expect(forwardButton.getAttribute('aria-disabled')).toBe('true')
    expect(backButton.tabIndex).toBe(0)
    expect(forwardButton.tabIndex).toBe(0)
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

  it('does not offer to close the sole new-view tab', () => {
    mocks.state.activeTabId = 'new-view'
    mocks.state.tabs = [{ kind: 'newView', id: 'new-view' }]

    render(<TableTabsView tableName={null} />)

    expect(screen.getByRole('tab', { name: 'New view' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Close new view' })).toBeNull()
  })

  it('forwards workspace navigation and tab actions', async () => {
    mocks.state.activeTabId = 'table:accounts'
    mocks.state.canGoBack = true
    mocks.state.canGoForward = true
    mocks.state.replaceableTabId = 'table:accounts'
    mocks.state.tabs = [
      { kind: 'table', id: 'table:accounts', tableName: 'accounts', search: {} },
      { kind: 'table', id: 'table:profiles', tableName: 'profiles', search: {} },
    ]
    render(<TableTabsView tableName="accounts" />)

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go forward' }))
    fireEvent.click(screen.getByRole('button', { name: 'New view' }))
    fireEvent.click(screen.getByRole('tab', { name: 'profiles' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close profiles' }))
    fireEvent.doubleClick(screen.getByRole('tab', { name: 'accounts' }))
    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: 'accounts' }).closest('[data-reorder-ready]'),
      ).toBeTruthy()
    })
    fireEvent.contextMenu(screen.getByRole('tab', { name: 'accounts' }), {
      clientX: 40,
      clientY: 20,
    })
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Move right' }))

    expect(mocks.goBack).toHaveBeenCalledOnce()
    expect(mocks.goForward).toHaveBeenCalledOnce()
    expect(mocks.openNewView).toHaveBeenCalledOnce()
    expect(mocks.activateTab).toHaveBeenCalledWith('table:profiles')
    expect(mocks.closeTab).toHaveBeenCalledWith('table:profiles')
    expect(mocks.persistTab).toHaveBeenCalledWith('table:accounts')
    expect(mocks.reorderTabs).toHaveBeenCalledWith(['table:profiles', 'table:accounts'])
  })

  it('shows the authored workspace navigation shortcuts', async () => {
    render(<TableTabsView tableName={null} />)

    const newViewButton = screen.getByRole('button', { name: 'New view' })
    fireEvent.mouseEnter(newViewButton)
    fireEvent.mouseMove(newViewButton)
    expect(await screen.findByLabelText('Alt+N')).toBeTruthy()

    fireEvent.mouseLeave(newViewButton)
    fireEvent.focus(screen.getByRole('button', { name: 'Go back' }))
    expect(await screen.findByLabelText('Alt+Left Bracket')).toBeTruthy()
  })
})
