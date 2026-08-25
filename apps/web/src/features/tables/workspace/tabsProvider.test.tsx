import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RuntimeScopeExitGuardProvider } from '@app/providers/runtimeScopeExitGuard'
import {
  TableMutationLedgerProvider,
  TableMutationLedgerWorkspaceProvider,
  useTableMutationLedger,
  useTableMutationWorkspace,
} from '@tables/mutationLedger/provider'
import { TableTabsProvider, useTableTabs } from '@tables/workspace/tabsProvider'
import { createTableScope } from '@tables/workspace/scope'

const navigate = vi.hoisted(() => vi.fn())
const routeSearch = vi.hoisted(() => ({ filters: undefined as string | undefined }))
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
  useInspectorSessionState: () => ({
    currentConnectionId: 'connection',
    currentTableName: 'accounts',
  }),
}))

vi.mock('@tables/schema/useAvailableTables', () => ({
  useAvailableTables: () => schemaState,
}))

afterEach(cleanup)

beforeEach(() => {
  navigate.mockReset()
  routeSearch.filters = undefined
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
      <button
        type="button"
        onClick={() => mutations.dispatch({ type: 'deleteRows', rowIds: ['row-1'] })}
      >
        Stage deletion
      </button>
      <button type="button" onClick={mutations.discardAll}>
        Discard changes
      </button>
    </>
  )
}

function TabActions(): React.ReactElement {
  const { closeTab, openBaseTabs, persistTable, replaceableTabId, tabs } = useTableTabs()
  const mutationWorkspace = useTableMutationWorkspace()
  return (
    <>
      <output aria-label="Open tabs">{tabs.map((tab) => tab.id).join(',')}</output>
      <output aria-label="Replaceable tab">{replaceableTabId ?? 'none'}</output>
      <output aria-label="Workspace pending">
        {String(mutationWorkspace.hasPendingChanges(tableScope))}
      </output>
      <button type="button" onClick={() => closeTab('table:accounts')}>
        Close accounts
      </button>
      <button type="button" onClick={() => openBaseTabs(['accounts'])}>
        Open accounts persistently
      </button>
      <button type="button" onClick={() => persistTable('profiles')}>
        Keep profiles open
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
    ).toContain('Closing the final accounts view will discard 1 staged change.')

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(screen.getByLabelText('Open tabs').textContent).toBe('table:accounts')
    expect(screen.getByLabelText('Staged changes').textContent).toBe('1')

    fireEvent.click(screen.getByRole('button', { name: 'Close accounts' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard and close' }))
    await waitFor(() => expect(screen.getByLabelText('Staged changes').textContent).toBe('0'))
    expect(screen.getByLabelText('Workspace pending').textContent).toBe('false')
    await waitFor(() => expect(screen.getByLabelText('Open tabs').textContent).toBe('new-view'))
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
