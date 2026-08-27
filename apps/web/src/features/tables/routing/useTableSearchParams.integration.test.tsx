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
      <button
        type="button"
        onClick={() =>
          void search.setFilters([{ id: 'filter-1', column: 'id', operator: 'eq', value: 'row-1' }])
        }
      >
        Filter row
      </button>
      <button type="button" onClick={() => void search.setPage(3)}>
        Page 3
      </button>
      <button type="button" onClick={() => void search.setPage(1)}>
        Page 1
      </button>
      <button type="button" onClick={() => void search.setPageSize(500)}>
        Show 500
      </button>
      <button type="button" onClick={() => void search.setPageSize(100)}>
        Show 100
      </button>
    </>
  )
}

function createTestRouter(initialEntry: string) {
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

  return createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: rootRoute.addChildren([
      connectionRoute.addChildren([
        tablesRoute.addChildren([tableRoute.addChildren([tableIndexRoute])]),
      ]),
    ]),
  })
}

describe('table route search ownership', () => {
  it('commits setter updates through the active route and replaces grid history', async () => {
    const router = createTestRouter(
      '/conn/connection/tables/accounts?page=4&pageSize=500&custom=discarded',
    )
    const filters = JSON.stringify([
      { id: 'filter-1', column: 'id', operator: 'eq', value: 'row-1' },
    ])

    render(<RouterProvider router={router} />)
    await screen.findByRole('button', { name: 'Filter row' })

    fireEvent.click(screen.getByRole('button', { name: 'Filter row' }))
    await waitFor(() => expect(router.state.location.search).toEqual({ filters, pageSize: 500 }))

    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ filters, page: 3, pageSize: 500 }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Page 1' }))
    await waitFor(() => expect(router.state.location.search).toEqual({ filters, pageSize: 500 }))

    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ filters, page: 3, pageSize: 500 }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Show 100' }))
    await waitFor(() => expect(router.state.location.search).toEqual({ filters }))

    fireEvent.click(screen.getByRole('button', { name: 'Show 500' }))
    await waitFor(() => expect(router.state.location.search).toEqual({ filters, pageSize: 500 }))

    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ filters, page: 3, pageSize: 500 }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sort by name' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Route search').textContent).toBe('name:desc:1'),
    )
    expect(router.state.location.search).toEqual({
      dir: 'desc',
      filters,
      pageSize: 500,
      sort: 'name',
    })
    await waitFor(() =>
      expect(screen.getByLabelText('Active tab search').textContent).toBe(
        JSON.stringify({ dir: 'desc', filters, pageSize: 500, sort: 'name' }),
      ),
    )
    await act(() => router.history.back())
    expect(router.state.location.search).toEqual({
      dir: 'desc',
      filters,
      pageSize: 500,
      sort: 'name',
    })
  })

  it('derives the active tab and its search from route navigation', async () => {
    const router = createTestRouter('/conn/connection/tables/accounts')

    render(<RouterProvider router={router} />)
    await screen.findByRole('button', { name: 'Sort by name' })

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
