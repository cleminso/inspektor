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

const navigate = vi.hoisted(() => vi.fn())
const availableTables = vi.hoisted(() => ['accounts'])

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useSearch: () => ({}),
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentConnectionId: 'connection',
    currentTableName: 'accounts',
  }),
}))

vi.mock('@tables/schema/useAvailableTables', () => ({
  useAvailableTables: () => ({ isSchemaReady: true, tables: availableTables }),
}))

afterEach(cleanup)

beforeEach(() => {
  navigate.mockReset()
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
  const { closeTab, tabs } = useTableTabs()
  const mutationWorkspace = useTableMutationWorkspace()
  return (
    <>
      <output aria-label="Open tabs">{tabs.map((tab) => tab.id).join(',')}</output>
      <output aria-label="Workspace pending">
        {String(mutationWorkspace.hasPendingChanges('scope:accounts'))}
      </output>
      <button type="button" onClick={() => closeTab('table:accounts')}>
        Close accounts
      </button>
    </>
  )
}

function Harness(): React.ReactElement {
  return (
    <RuntimeScopeExitGuardProvider>
      <TableMutationLedgerWorkspaceProvider>
        <TableTabsProvider scope="scope">
          <TableMutationLedgerProvider
            schemaColumns={[]}
            scopeKey="scope:accounts"
          >
            <MutationActions />
          </TableMutationLedgerProvider>
          <TabActions />
        </TableTabsProvider>
      </TableMutationLedgerWorkspaceProvider>
    </RuntimeScopeExitGuardProvider>
  )
}

describe('TableTabsProvider staged mutation close policy', () => {
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
    ).toContain(
      'Closing the final accounts view will discard 1 staged change.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(screen.getByLabelText('Open tabs').textContent).toBe('table:accounts')
    expect(screen.getByLabelText('Staged changes').textContent).toBe('1')

    fireEvent.click(screen.getByRole('button', { name: 'Close accounts' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard and close' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Staged changes').textContent).toBe('0'),
    )
    expect(screen.getByLabelText('Workspace pending').textContent).toBe('false')
    await waitFor(() =>
      expect(screen.getByLabelText('Open tabs').textContent).toBe('new-view'),
    )
  })

  it('closes a non-final table view without discarding staged changes', async () => {
    window.localStorage.setItem(
      'regarde-inspector-tabs',
      JSON.stringify({
        version: 2,
        scopes: {
          scope: {
            recentViews: [],
            tabs: [
              { id: 'table:accounts', kind: 'table', search: {}, tableName: 'accounts' },
              {
                id: 'view:filtered-accounts',
                kind: 'table',
                search: { filters: 'name:eq:Ada' },
                tableName: 'accounts',
              },
            ],
          },
        },
      }),
    )
    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByLabelText('Open tabs').textContent).toContain('view:filtered-accounts'),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Stage deletion' }))

    fireEvent.click(screen.getByRole('button', { name: 'Close accounts' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByLabelText('Staged changes').textContent).toBe('1')
    await waitFor(() =>
      expect(screen.getByLabelText('Open tabs').textContent).toBe('view:filtered-accounts'),
    )
  })
})
