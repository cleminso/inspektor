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
      params: { connectionId: string }
    }) => Promise<unknown>

    await expect(loader({ params: { connectionId: 'connection-1' } })).resolves.toBe(target)
    expect(resolveStoredTablesNavigationTarget).toHaveBeenCalledWith({
      connectionId: 'connection-1',
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
