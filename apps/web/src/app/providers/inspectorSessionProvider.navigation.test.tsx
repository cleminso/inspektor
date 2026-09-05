import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  InspectorSessionProvider,
  useInspectorSessionContext,
} from '@app/providers/inspectorSessionProvider'

const session = vi.hoisted(() => ({
  activeConnection: null,
  activeConnectionId: 'connection-1',
  connections: [],
  deleteConnection: vi.fn(),
  getConnection: vi.fn(() => ({
    id: 'connection-1',
    name: 'Connection 1',
    serverUrl: 'https://sync.example.com',
    appId: 'app-1',
    adminSecret: 'secret-1',
    env: 'dev',
  })),
  getConnectionPreferences: vi.fn(() => ({
    lastBranch: 'main',
    lastSchemaHash: 'schema-1',
  })),
  getRememberedBranches: vi.fn(() => ['main']),
  resolveBranch: vi.fn(),
  resolveSchemaHash: vi.fn(),
  saveConnectionWithContext: vi.fn(),
  setConnectionContext: vi.fn(),
}))

vi.mock('@app/session/useInspectorSession', () => ({
  useStoredConnections: () => session,
}))

afterEach(() => {
  cleanup()
  session.setConnectionContext.mockClear()
})

function RootLayout(): React.ReactElement {
  return (
    <InspectorSessionProvider>
      <SchemaAction />
      <Outlet />
    </InspectorSessionProvider>
  )
}

function SchemaAction(): React.ReactElement {
  const { switchSchema } = useInspectorSessionContext()
  return (
    <button type="button" onClick={() => switchSchema('schema-2')}>
      Switch schema
    </button>
  )
}

function createTestRouter(initialPath: string) {
  const rootRoute = createRootRoute({ component: RootLayout })
  const connectionRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'conn/$connectionId',
    validateSearch: (search: Record<string, unknown>) => ({
      schema: typeof search.schema === 'string' ? search.schema : undefined,
    }),
  })
  const tablesRoute = createRoute({
    getParentRoute: () => connectionRoute,
    path: 'tables',
  })
  const tableRoute = createRoute({
    getParentRoute: () => tablesRoute,
    path: '$tableName',
  })
  const queriesRoute = createRoute({
    getParentRoute: () => connectionRoute,
    path: 'live-queries',
  })

  return createRouter({
    history: createMemoryHistory({ initialEntries: [`${initialPath}?schema=schema-1`] }),
    routeTree: rootRoute.addChildren([
      connectionRoute.addChildren([tablesRoute.addChildren([tableRoute]), queriesRoute]),
    ]),
  })
}

describe('InspectorSessionProvider schema navigation', () => {
  it.each([
    '/conn/connection-1/tables',
    '/conn/connection-1/tables/accounts',
    '/conn/connection-1/live-queries',
  ])('preserves %s while changing the selected schema', async (initialPath) => {
    const router = createTestRouter(initialPath)
    render(<RouterProvider router={router} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Switch schema' }))

    await waitFor(() => expect(router.state.location.search.schema).toBe('schema-2'))
    expect(router.state.location.pathname).toBe(initialPath)
    expect(session.setConnectionContext).toHaveBeenCalledWith('connection-1', 'main', 'schema-2')
  })
})
