// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const routeOptions = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))
const router = vi.hoisted(() => ({ invalidate: vi.fn() }))
const resolveStoredRuntimeTarget = vi.hoisted(() => vi.fn())
const prepareJazzWasm = vi.hoisted(() => vi.fn())
const storedConnections = vi.hoisted(() => ({ connections: [{ id: 'connection-1' }] }))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  createFileRoute: () => (options: Record<string, unknown>) => {
    routeOptions.current = options
    return {
      useLoaderData: () => ({
        branch: 'main',
        connectionId: 'connection-1',
        schemaCatalogue: [{ hash: 'schema-1', publishedAt: 1 }],
        schemaHash: 'schema-1',
      }),
    }
  },
  Outlet: () => null,
  useRouter: () => router,
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { pathname: '/conn/connection-1/live-queries' } }),
}))

vi.mock('@app/routing/inspectorNavigation', () => ({
  redirectToConnections: vi.fn(),
  resolveStoredRuntimeTarget,
}))

vi.mock('@app/connections/connections', () => ({
  getConnectionById: (store: typeof storedConnections, connectionId: string) =>
    store.connections.find((connection) => connection.id === connectionId) ?? null,
  readStoredConnections: () => storedConnections,
}))

vi.mock('@app/runtime/jazzWasmPreparation', () => ({ prepareJazzWasm }))

vi.mock('@app/runtime/inspectorRuntimeBoundary', () => ({
  InspectorRuntimeBoundary: ({ fallback }: { fallback?: React.ReactNode }) => fallback ?? null,
}))

vi.mock('@app/shell/layout', () => ({
  InspectorLayout: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@inspektor/ds', () => ({
  Box: ({ children, role }: { children: React.ReactNode; role?: string }) => (
    <div role={role}>{children}</div>
  ),
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Spinner: () => <span data-slot="spinner" />,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

await import('./$connectionId')
const { ConnectionRouteError } = await import('./-connectionRouteStatus')

afterEach(() => {
  cleanup()
  resolveStoredRuntimeTarget.mockReset()
  prepareJazzWasm.mockReset()
  router.invalidate.mockReset()
})

describe('connection route', () => {
  it('loads the runtime target through the stored connection resolver', async () => {
    const target = {
      branch: 'main',
      connectionId: 'connection-1',
      schemaCatalogue: [{ hash: 'schema-1', publishedAt: 1 }],
      schemaHash: 'schema-1',
    }
    resolveStoredRuntimeTarget.mockResolvedValueOnce(target)
    const loader = routeOptions.current?.loader as (options: {
      deps: { schemaHash: string | undefined }
      params: { connectionId: string }
    }) => Promise<unknown>

    await expect(
      loader({ deps: { schemaHash: 'schema-1' }, params: { connectionId: 'connection-1' } }),
    ).resolves.toBe(target)
    expect(resolveStoredRuntimeTarget).toHaveBeenCalledWith({
      connectionId: 'connection-1',
      schemaHashOverride: 'schema-1',
      store: storedConnections,
    })
    expect(prepareJazzWasm).toHaveBeenCalledOnce()
    expect(prepareJazzWasm.mock.invocationCallOrder[0]).toBeLessThan(
      resolveStoredRuntimeTarget.mock.invocationCallOrder[0]!,
    )
  })

  it('validates the schema search parameter for loader dependencies', () => {
    const validateSearch = routeOptions.current?.validateSearch as (
      search: Record<string, unknown>,
    ) => { schema?: string }
    const loaderDeps = routeOptions.current?.loaderDeps as (options: {
      search: { schema?: string }
    }) => { schemaHash?: string }

    expect(validateSearch({ schema: ' schema-2 ' })).toEqual({ schema: 'schema-2' })
    expect(validateSearch({ schema: 2 })).toEqual({ schema: undefined })
    expect(loaderDeps({ search: { schema: 'schema-2' } })).toEqual({ schemaHash: 'schema-2' })
  })

  it('retains the selected schema through connection child navigation', () => {
    const searchOptions = routeOptions.current?.search as
      | {
          middlewares?: Array<
            (options: {
              search: Record<string, unknown>
              next: () => {
                meta: Record<string, unknown>
                search: Record<string, unknown>
              }
            }) => Record<string, unknown>
          >
        }
      | undefined
    const middleware = searchOptions?.middlewares?.[0]

    expect(middleware).toBeTypeOf('function')
    expect(
      middleware?.({
        search: { schema: 'schema-2' },
        next: () => ({ meta: {}, search: { empty: 'true' } }),
      }),
    ).toEqual({ empty: 'true', schema: 'schema-2' })
  })

  it('replaces an unavailable schema URL with the resolved fallback', async () => {
    resolveStoredRuntimeTarget.mockResolvedValueOnce({
      branch: 'main',
      connectionId: 'connection-1',
      schemaCatalogue: [{ hash: 'schema-1', publishedAt: 1 }],
      schemaHash: 'schema-1',
    })
    const loader = routeOptions.current?.loader as (options: {
      deps: { schemaHash: string | undefined }
      location: { hash: string; pathname: string; searchStr: string }
      params: { connectionId: string }
    }) => Promise<unknown>

    await expect(
      loader({
        deps: { schemaHash: 'missing-schema' },
        location: {
          hash: 'rows',
          pathname: '/conn/connection-1/live-queries',
          searchStr: '?schema=missing-schema&filter=active',
        },
        params: { connectionId: 'connection-1' },
      }),
    ).rejects.toMatchObject({
      options: {
        href: '/conn/connection-1/live-queries?schema=schema-1&filter=active#rows',
        replace: true,
      },
    })
  })

  it('shows an empty loading view while the destination connection loads', () => {
    const PendingComponent = routeOptions.current?.pendingComponent as () => React.ReactElement

    expect(routeOptions.current?.gcTime).toBeUndefined()
    expect(routeOptions.current?.pendingMs).toBe(0)
    expect(routeOptions.current?.pendingMinMs).toBe(0)
    expect(routeOptions.current?.errorComponent).toBeTypeOf('function')
    render(<PendingComponent />)
    expect(screen.getByRole('status').textContent).toBe('Loading')
    expect(document.querySelector('[data-slot="spinner"]')).toBeTruthy()
  })

  it('keeps the loading view visible while the runtime synchronizes', () => {
    const RuntimeRoute = routeOptions.current?.component as () => React.ReactElement

    render(<RuntimeRoute />)

    expect(screen.getByRole('status').textContent).toBe('Loading')
  })

  it('normalizes loader errors and retries through router invalidation', () => {
    render(
      <ConnectionRouteError
        error={new Error('secret server detail')}
        info={{ componentStack: '' }}
        reset={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert').textContent).not.toContain('secret server detail')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(router.invalidate).toHaveBeenCalledOnce()
  })
})
