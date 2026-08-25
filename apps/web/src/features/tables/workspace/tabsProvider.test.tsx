import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RuntimeScopeExitGuardProvider } from '@app/providers/runtimeScopeExitGuard'
import {
  TableMutationLedgerProvider,
  TableMutationLedgerWorkspaceProvider,
  useTableMutationLedger,
} from '@tables/mutationLedger/provider'
import { TableTabsProvider, useTableTabs } from '@tables/workspace/tabsProvider'
import { createTableScope } from '@tables/workspace/scope'

const navigate = vi.hoisted(() => vi.fn())
const routeSearch = vi.hoisted(() => ({
  empty: undefined as string | undefined,
  filters: undefined as string | undefined,
}))
const sessionState = vi.hoisted(() => ({
  currentConnectionId: 'connection' as string | null,
  currentTableName: 'accounts' as string | null,
}))
const schemaState = vi.hoisted(() => ({
  isSchemaReady: true,
  tables: ['accounts', 'profiles'],
}))
const tableScope = createTableScope('scope', 'accounts')

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useSearch: () => routeSearch,
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => sessionState,
}))

vi.mock('@tables/schema/useAvailableTables', () => ({
  useAvailableTables: () => schemaState,
}))

afterEach(cleanup)

beforeEach(() => {
  navigate.mockReset()
  routeSearch.empty = undefined
  routeSearch.filters = undefined
  sessionState.currentConnectionId = 'connection'
  sessionState.currentTableName = 'accounts'
  schemaState.isSchemaReady = true
  schemaState.tables = ['accounts', 'profiles']
  const values = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
})

function MutationActions(): React.ReactElement {
  const mutations = useTableMutationLedger()
  return (
    <>
      <output aria-label="Staged changes">{mutations.ledger.entries.length}</output>
      <button type="button" onClick={() => mutations.stageDeletions(['row-1'])}>
        Stage deletion
      </button>
      <button type="button" onClick={mutations.discardAll}>
        Discard changes
      </button>
    </>
  )
}

function TabActions(): React.ReactElement {
  const { activeTabId, closeTab, openBaseTabs, openNewView, persistTable, replaceableTabId, tabs } =
    useTableTabs()
  return (
    <>
      <output aria-label="Active tab">{activeTabId ?? 'none'}</output>
      <output aria-label="Open tabs">{tabs.map((tab) => tab.id).join(',')}</output>
      <output aria-label="Replaceable tab">{replaceableTabId ?? 'none'}</output>
      <button type="button" onClick={() => closeTab('table:accounts')}>
        Close accounts
      </button>
      <button type="button" onClick={() => openBaseTabs(['accounts'])}>
        Open accounts persistently
      </button>
      <button type="button" onClick={() => persistTable('profiles')}>
        Keep profiles open
      </button>
      <button type="button" onClick={openNewView}>
        Open New view
      </button>
    </>
  )
}

function Harness(): React.ReactElement {
  return (
    <RuntimeScopeExitGuardProvider>
      <TableMutationLedgerWorkspaceProvider>
        <TableTabsProvider scope="scope">
          <TableMutationLedgerProvider schemaColumns={[]} scopeKey={tableScope}>
            <MutationActions />
          </TableMutationLedgerProvider>
          <TabActions />
        </TableTabsProvider>
      </TableMutationLedgerWorkspaceProvider>
    </RuntimeScopeExitGuardProvider>
  )
}

describe('TableTabsProvider', () => {
  it('opens a missing routed table as replaceable and persists it through bulk open', async () => {
    render(<Harness />)

    await waitFor(() =>
      expect(screen.getByLabelText('Replaceable tab').textContent).toBe('table:accounts'),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open accounts persistently' }))

    await waitFor(() => expect(screen.getByLabelText('Replaceable tab').textContent).toBe('none'))
    expect(screen.getByLabelText('Open tabs').textContent).toBe('table:accounts')
  })

  it('persists an unopened table while replacing the current replaceable tab', async () => {
    render(<Harness />)

    await waitFor(() =>
      expect(screen.getByLabelText('Replaceable tab').textContent).toBe('table:accounts'),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Keep profiles open' }))

    await waitFor(() => expect(screen.getByLabelText('Replaceable tab').textContent).toBe('none'))
    expect(screen.getByLabelText('Open tabs').textContent).toBe('table:profiles')
  })

  it('derives selection from the route and preserves another replaceable tab from New view', async () => {
    const { rerender } = render(<Harness />)
    await waitFor(() =>
      expect(screen.getByLabelText('Replaceable tab').textContent).toBe('table:accounts'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open New view' }))
    sessionState.currentTableName = null
    routeSearch.empty = 'true'
    rerender(<Harness />)
    expect(screen.getByLabelText('Active tab').textContent).toBe('new-view')

    sessionState.currentTableName = 'profiles'
    routeSearch.empty = undefined
    rerender(<Harness />)

    await waitFor(() =>
      expect(screen.getByLabelText('Open tabs').textContent).toBe('table:accounts,table:profiles'),
    )
    expect(screen.getByLabelText('Active tab').textContent).toBe('table:profiles')
    expect(screen.getByLabelText('Replaceable tab').textContent).toBe('table:accounts')
  })

  it('retains a legacy routed data tab while schema metadata is loading', async () => {
    routeSearch.filters = 'active-filter'
    schemaState.isSchemaReady = false
    window.localStorage.setItem(
      'inspektor-tabs:scope',
      JSON.stringify({
        version: 1,
        recentViews: [],
        tabs: [
          {
            id: 'view:accounts-filtered',
            kind: 'table',
            search: { filters: 'active-filter' },
            tableName: 'accounts',
          },
        ],
      }),
    )

    render(<Harness />)

    await waitFor(() =>
      expect(screen.getByLabelText('Open tabs').textContent).toBe('table:accounts'),
    )
    expect(screen.getByLabelText('Replaceable tab').textContent).toBe('none')
    await waitFor(() => {
      const storedState = JSON.parse(
        window.localStorage.getItem('inspektor-tabs:scope') ?? 'null',
      ) as {
        tabs: Array<{ search: { filters?: string } }>
      }
      expect(storedState.tabs[0]?.search.filters).toBe('active-filter')
    })
  })

  it('confirms before discarding changes and closing the final table tab', async () => {
    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByLabelText('Open tabs').textContent).toBe('table:accounts'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Stage deletion' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close accounts' }))
    expect(screen.getByLabelText('Open tabs').textContent).toBe('table:accounts')
    expect(
      screen.getByRole('alertdialog', { name: 'Discard staged changes?' }).textContent,
    ).toContain('Closing the final accounts view will discard any staged changes.')

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(screen.getByLabelText('Open tabs').textContent).toBe('table:accounts')
    expect(screen.getByLabelText('Staged changes').textContent).toBe('1')

    fireEvent.click(screen.getByRole('button', { name: 'Close accounts' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard and close' }))
    await waitFor(() => expect(screen.getByLabelText('Staged changes').textContent).toBe('0'))
    await waitFor(() => expect(screen.getByLabelText('Open tabs').textContent).toBe('new-view'))
  })

  it('keeps the active route while confirming an inactive final table tab close', async () => {
    sessionState.currentTableName = 'profiles'
    window.localStorage.setItem(
      'inspektor-tabs:scope',
      JSON.stringify({
        version: 1,
        recentViews: [],
        tabs: [
          { id: 'table:accounts', kind: 'table', search: {}, tableName: 'accounts' },
          { id: 'table:profiles', kind: 'table', search: {}, tableName: 'profiles' },
        ],
      }),
    )
    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByLabelText('Open tabs').textContent).toBe('table:accounts,table:profiles'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Stage deletion' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close accounts' }))

    expect(screen.getByRole('alertdialog', { name: 'Discard staged changes?' })).toBeDefined()
    expect(screen.getByLabelText('Active tab').textContent).toBe('table:profiles')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('closes a non-final table view without discarding staged changes', async () => {
    window.localStorage.setItem(
      'inspektor-tabs:scope',
      JSON.stringify({
        version: 1,
        recentViews: [],
        tabs: [
          { id: 'table:accounts', kind: 'table', search: {}, tableName: 'accounts' },
          {
            id: 'schema:accounts',
            kind: 'table',
            search: { view: 'schema' },
            tableName: 'accounts',
          },
        ],
      }),
    )
    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByLabelText('Open tabs').textContent).toContain('schema:accounts'),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Stage deletion' }))

    fireEvent.click(screen.getByRole('button', { name: 'Close accounts' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByLabelText('Staged changes').textContent).toBe('1')
    await waitFor(() =>
      expect(screen.getByLabelText('Open tabs').textContent).toBe('schema:accounts'),
    )
  })
})
