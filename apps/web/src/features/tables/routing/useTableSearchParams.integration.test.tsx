import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useParams,
} from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RuntimeScopeExitGuardProvider } from '@app/providers/runtimeScopeExitGuard'
import { TableMutationLedgerWorkspaceProvider } from '@tables/mutationLedger/provider'
import { canonicalizeTableRouteSearch } from '@tables/routing/tableRowsSearch'
import { useTableExplorerSearchParams } from '@tables/routing/useTableSearchParams'
import { TableTabsProvider, useTableTabs } from '@tables/workspace/tabsProvider'

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => {
    const params = useParams({ strict: false })
    return {
      currentConnectionId: params.connectionId ?? null,
      currentTableName: params.tableName ?? null,
    }
  },
}))

vi.mock('@tables/schema/useAvailableTables', () => ({
  useAvailableTables: () => ({ isSchemaReady: true, tables: ['accounts', 'profiles'] }),
}))

afterEach(cleanup)

function Providers(): React.ReactElement {
  return (
    <RuntimeScopeExitGuardProvider>
      <TableMutationLedgerWorkspaceProvider>
        <TableTabsProvider scope="test-scope">
          <Outlet />
        </TableTabsProvider>
      </TableMutationLedgerWorkspaceProvider>
    </RuntimeScopeExitGuardProvider>
  )
}

function Harness(): React.ReactElement {
  const search = useTableExplorerSearchParams()
  const { activeTabId, tabs } = useTableTabs()
  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  return (
    <>
      <output aria-label="Route search">
        {`${search.sortColumn}:${search.sortDirection}:${search.page}`}
      </output>
      <output aria-label="Active tab">{activeTabId}</output>
      <output aria-label="Active tab search">
        {activeTab?.kind === 'table' ? JSON.stringify(activeTab.search) : ''}
      </output>
      <button type="button" onClick={() => void search.setSorting('name', 'desc')}>
        Sort by name
      </button>
    </>
  )
}

describe('table route search ownership', () => {
  it('commits canonical search and derives the active tab from route identity', async () => {
    const rootRoute = createRootRoute({ component: Outlet })
    const connectionRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: 'conn/$connectionId',
    })
    const tablesRoute = createRoute({
      component: Providers,
      getParentRoute: () => connectionRoute,
      path: 'tables',
      validateSearch: canonicalizeTableRouteSearch,
    })
    const tableRoute = createRoute({
      getParentRoute: () => tablesRoute,
      path: '$tableName',
    })
    const tableIndexRoute = createRoute({
      component: Harness,
      getParentRoute: () => tableRoute,
      path: '/',
    })
    const router = createRouter({
      history: createMemoryHistory({
        initialEntries: ['/conn/connection/tables/accounts?page=3&custom=discarded'],
      }),
      routeTree: rootRoute.addChildren([
        connectionRoute.addChildren([
          tablesRoute.addChildren([tableRoute.addChildren([tableIndexRoute])]),
        ]),
      ]),
    })

    render(<RouterProvider router={router} />)
    await screen.findByRole('button', { name: 'Sort by name' })
    fireEvent.click(screen.getByRole('button', { name: 'Sort by name' }))

    await waitFor(() =>
      expect(screen.getByLabelText('Route search').textContent).toBe('name:desc:1'),
    )
    expect(router.state.location.href).toBe('/conn/connection/tables/accounts?dir=desc&sort=name')
    await waitFor(() =>
      expect(screen.getByLabelText('Active tab search').textContent).toBe(
        JSON.stringify({ dir: 'desc', sort: 'name' }),
      ),
    )
    await act(() => router.history.back())
    expect(router.state.location.href).toBe('/conn/connection/tables/accounts?dir=desc&sort=name')

    await act(() =>
      router.navigate({
        to: '/conn/$connectionId/tables/$tableName',
        params: { connectionId: 'connection', tableName: 'profiles' },
        search: { view: 'schema' },
      }),
    )

    await waitFor(() =>
      expect(screen.getByLabelText('Active tab').textContent).toBe('schema:profiles'),
    )
    expect(screen.getByLabelText('Active tab search').textContent).toBe(
      JSON.stringify({ view: 'schema' }),
    )
  })
})
