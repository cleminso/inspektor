// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const routeOptions = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))
const router = vi.hoisted(() => ({ invalidate: vi.fn() }))
const resolveStoredTablesNavigationTarget = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  createFileRoute: () => (options: Record<string, unknown>) => {
    routeOptions.current = options
    return { useLoaderData: vi.fn() }
  },
  Outlet: () => null,
  useRouter: () => router,
}))

vi.mock('@app/routing/inspectorNavigation', () => ({
  redirectToConnections: vi.fn(),
  resolveStoredTablesNavigationTarget,
}))

vi.mock('@app/runtime/inspectorRuntimeBoundary', () => ({
  InspectorRuntimeBoundary: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@inspector/ds', () => ({
  Box: ({ children, role }: { children: React.ReactNode; role?: string }) => (
    <div role={role}>{children}</div>
  ),
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

await import('./$connectionId')
const { ConnectionRouteError, ConnectionRoutePending } = await import('./-connectionRouteStatus')

afterEach(() => {
  cleanup()
  resolveStoredTablesNavigationTarget.mockReset()
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
    resolveStoredTablesNavigationTarget.mockResolvedValueOnce(target)
    const loader = routeOptions.current?.loader as (options: {
      deps: { schemaHash: string | undefined }
      params: { connectionId: string }
    }) => Promise<unknown>

    await expect(
      loader({ deps: { schemaHash: 'schema-1' }, params: { connectionId: 'connection-1' } }),
    ).resolves.toBe(target)
    expect(resolveStoredTablesNavigationTarget).toHaveBeenCalledWith({
      connectionId: 'connection-1',
      schemaHashOverride: 'schema-1',
    })
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
    resolveStoredTablesNavigationTarget.mockResolvedValueOnce({
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
          pathname: '/conn/connection-1/queries',
          searchStr: '?schema=missing-schema&filter=active',
        },
        params: { connectionId: 'connection-1' },
      }),
    ).rejects.toMatchObject({
      options: {
        href: '/conn/connection-1/queries?schema=schema-1&filter=active#rows',
        replace: true,
      },
    })
  })

  it('registers and renders route-owned loading feedback', () => {
    expect(routeOptions.current?.pendingComponent).toBe(ConnectionRoutePending)
    expect(routeOptions.current?.errorComponent).toBeTypeOf('function')

    render(<ConnectionRoutePending />)

    expect(screen.getByRole('status').textContent).toBe('Opening connection…')
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
