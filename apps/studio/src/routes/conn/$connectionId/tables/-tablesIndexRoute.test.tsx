// The `-` prefix keeps this test module out of TanStack Router's generated route tree.
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigate = vi.hoisted(() => vi.fn(() => Promise.resolve()))
const cancelPreparation = vi.hoisted(() => vi.fn())
const prepareNavigation = vi.hoisted(() => vi.fn())
const params = vi.hoisted(() => ({ connectionId: 'connection-1' }))
const routeState = vi.hoisted(() => ({
  isSchemaReady: true,
  recentViews: [
    {
      kind: 'table' as const,
      id: 'table:profiles',
      tableName: 'profiles',
      search: {
        filters: '[{"id":"filter-1","column":"name","operator":"contains","value":"Ada"}]',
        page: 2,
      },
    },
  ],
  search: {} as { empty?: string },
  tables: ['accounts', 'profiles'],
}))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
  useParams: () => params,
  useSearch: () => routeState.search,
}))

vi.mock('@tables/schema/useAvailableTables', () => ({
  useAvailableTables: () => routeState,
}))

vi.mock('@tables/workspace/tabsProvider', () => ({
  useTableTabs: () => routeState,
}))

vi.mock('@tables/routing/tableNavigationPreparation', () => ({
  useTableNavigationPreparation: () => ({
    cancel: cancelPreparation,
    prepare: prepareNavigation,
  }),
}))

const { TablesIndexRoute } = await import('./-tablesIndexRoute')

beforeEach(() => {
  navigate.mockReset()
  navigate.mockResolvedValue(undefined)
  cancelPreparation.mockReset()
  prepareNavigation.mockReset()
  prepareNavigation.mockImplementation(async (_options, commit) => {
    await commit()
    return 'committed'
  })
  routeState.isSchemaReady = true
  routeState.recentViews = [
    {
      kind: 'table',
      id: 'table:profiles',
      tableName: 'profiles',
      search: {
        filters: '[{"id":"filter-1","column":"name","operator":"contains","value":"Ada"}]',
        page: 2,
      },
    },
  ]
  routeState.search = {}
  routeState.tables = ['accounts', 'profiles']
})

afterEach(cleanup)

describe('tables index route', () => {
  it('selects the initial table only after schema readiness', async () => {
    routeState.isSchemaReady = false
    const { rerender } = render(<TablesIndexRoute />)

    expect(navigate).not.toHaveBeenCalled()

    routeState.isSchemaReady = true
    rerender(<TablesIndexRoute />)

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/conn/$connectionId/tables/$tableName',
        params: { connectionId: 'connection-1', tableName: 'profiles' },
        replace: true,
        search: {
          filters: '[{"id":"filter-1","column":"name","operator":"contains","value":"Ada"}]',
          page: 2,
        },
      }),
    )
    expect(prepareNavigation).toHaveBeenCalledWith(
      {
        policy: 'replace',
        search: {
          filters: [{ id: 'filter-1', column: 'name', operator: 'contains', value: 'Ada' }],
          page: 2,
          pageSize: 100,
          sortColumn: 'id',
          sortDirection: 'asc',
        },
        tableName: 'profiles',
      },
      expect.any(Function),
    )
    expect(prepareNavigation.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    )

    navigate.mockReset()
    routeState.recentViews = []
    routeState.tables = ['accounts']
    rerender(<TablesIndexRoute />)
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        expect.objectContaining({ params: expect.objectContaining({ tableName: 'accounts' }) }),
      ),
    )

    navigate.mockReset()
    routeState.search = { empty: 'true' }
    rerender(<TablesIndexRoute />)
    expect(navigate).not.toHaveBeenCalled()

    routeState.search = {}
    routeState.tables = []
    rerender(<TablesIndexRoute />)
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/conn/$connectionId/tables',
        params: { connectionId: 'connection-1' },
        replace: true,
        search: { empty: 'true' },
      }),
    )
  })
})
