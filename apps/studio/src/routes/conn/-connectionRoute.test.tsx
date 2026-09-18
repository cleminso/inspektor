// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSchemaCatalogueLoadError } from '@app/connections/connectionValidation'

const routeOptions = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))
const resolveStoredRuntimeTarget = vi.hoisted(() => vi.fn())
const resolveRuntimeConnection = vi.hoisted(() =>
  vi.fn<() => { adminSecret: string } | null>(() => ({ adminSecret: 'secret' })),
)
const redirectToEditConnection = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('redirect to edit')
  }),
)
const prepareJazzWasm = vi.hoisted(() => vi.fn())
const connectionRecovery = vi.hoisted(() => ({ begin: vi.fn(), reload: vi.fn() }))
const storedConnections = vi.hoisted(() => ({ connections: [{ id: 'connection-1' }] }))
let resolvedTheme = 'light'

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
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { pathname: '/conn/connection-1/live-queries' } }),
}))

vi.mock('@app/routing/inspectorNavigation', () => ({
  redirectToEditConnection,
  redirectToConnections: vi.fn(),
  resolveStoredRuntimeTarget,
}))

vi.mock('@app/connections/connectionCredentials', () => ({
  resolveRuntimeConnection,
}))

vi.mock('@app/connections/connections', () => ({
  getConnectionById: (store: typeof storedConnections, connectionId: string) =>
    store.connections.find((connection) => connection.id === connectionId) ?? null,
  readStoredConnections: () => storedConnections,
}))

vi.mock('@app/runtime/jazzWasmPreparation', () => ({ prepareJazzWasm }))
vi.mock('@app/connections/connectionRecovery', () => ({
  beginAutomaticConnectionRecovery: connectionRecovery.begin,
  reloadConnectionPage: connectionRecovery.reload,
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme }),
}))

vi.mock('@app/runtime/inspectorRuntimeBoundary', () => ({
  InspectorRuntimeBoundary: ({ fallback }: { fallback?: React.ReactNode }) => fallback ?? null,
}))

vi.mock('@app/shell/layout', () => ({
  InspectorLayout: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@inspektor/ds', () => ({
  Accordion: Object.assign(({ children }: { children: React.ReactNode }) => <div>{children}</div>, {
    Header: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    Item: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Trigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  }),
  Box: ({
    'aria-atomic': ariaAtomic,
    'aria-label': ariaLabel,
    'aria-live': ariaLive,
    children,
    role,
  }: {
    'aria-atomic'?: boolean | 'false' | 'true'
    'aria-label'?: string
    'aria-live'?: 'assertive' | 'off' | 'polite'
    children: React.ReactNode
    role?: string
  }) => (
    <div role={role} aria-atomic={ariaAtomic} aria-label={ariaLabel} aria-live={ariaLive}>
      {children}
    </div>
  ),
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  CopyButton: ({ label }: { label: string }) => <button>{label}</button>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

await import('./$connectionId')
const { ConnectionRouteError } = await import('./-connectionRouteStatus')

afterEach(() => {
  cleanup()
  resolveStoredRuntimeTarget.mockReset()
  resolveRuntimeConnection.mockReset()
  resolveRuntimeConnection.mockReturnValue({ adminSecret: 'secret' })
  redirectToEditConnection.mockClear()
  prepareJazzWasm.mockReset()
  connectionRecovery.begin.mockReset()
  connectionRecovery.begin.mockReturnValue(false)
  connectionRecovery.reload.mockReset()
  resolvedTheme = 'light'
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
      abortController: AbortController
      deps: { schemaHash: string | undefined }
      params: { connectionId: string }
    }) => Promise<unknown>
    const abortController = new AbortController()

    await expect(
      loader({
        abortController,
        deps: { schemaHash: 'schema-1' },
        params: { connectionId: 'connection-1' },
      }),
    ).resolves.toBe(target)
    expect(resolveStoredRuntimeTarget).toHaveBeenCalledWith({
      connectionId: 'connection-1',
      schemaHashOverride: 'schema-1',
      signal: abortController.signal,
      store: storedConnections,
    })
    expect(prepareJazzWasm).toHaveBeenCalledOnce()
    expect(prepareJazzWasm.mock.invocationCallOrder[0]).toBeLessThan(
      resolveStoredRuntimeTarget.mock.invocationCallOrder[0]!,
    )
  })

  it('redirects a saved profile without a current credential to its edit form', async () => {
    resolveRuntimeConnection.mockReturnValueOnce(null)
    const loader = routeOptions.current?.loader as (options: {
      abortController: AbortController
      deps: { schemaHash: string | undefined }
      params: { connectionId: string }
    }) => Promise<unknown>

    await expect(
      loader({
        abortController: new AbortController(),
        deps: { schemaHash: undefined },
        params: { connectionId: 'connection-1' },
      }),
    ).rejects.toThrow('redirect to edit')
    expect(redirectToEditConnection).toHaveBeenCalledWith('connection-1')
    expect(resolveStoredRuntimeTarget).not.toHaveBeenCalled()
    expect(prepareJazzWasm).not.toHaveBeenCalled()
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
      abortController: AbortController
      deps: { schemaHash: string | undefined }
      location: { hash: string; pathname: string; searchStr: string }
      params: { connectionId: string }
    }) => Promise<unknown>

    await expect(
      loader({
        abortController: new AbortController(),
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

  it('shows the wordmark while the destination connection loads', () => {
    const PendingComponent = routeOptions.current?.pendingComponent as () => React.ReactElement

    expect(routeOptions.current?.gcTime).toBeUndefined()
    expect(routeOptions.current?.pendingMs).toBe(0)
    expect(routeOptions.current?.pendingMinMs).toBe(0)
    expect(routeOptions.current?.errorComponent).toBeTypeOf('function')
    render(<PendingComponent />)
    const loading = screen.getByRole('status', { name: 'Loading' })
    const wordmark = document.querySelector('img')
    expect(loading.textContent).toBe('')
    expect(loading.getAttribute('aria-live')).toBe('polite')
    expect(loading.getAttribute('aria-atomic')).toBe('true')
    expect(wordmark?.getAttribute('src')).toBe('/conn/brand/inspektorWordmarkOnLight.png')
    expect(wordmark?.getAttribute('alt')).toBe('')
    expect(wordmark?.getAttribute('aria-hidden')).toBe('true')
    expect(wordmark?.getAttribute('width')).toBe('160')
    expect(wordmark?.getAttribute('height')).toBe('23')
  })

  it('uses the on-dark wordmark in the dark theme', () => {
    resolvedTheme = 'dark'
    const PendingComponent = routeOptions.current?.pendingComponent as () => React.ReactElement

    render(<PendingComponent />)

    expect(document.querySelector('img')?.getAttribute('src')).toBe(
      '/conn/brand/inspektorWordmarkOnDark.png',
    )
  })

  it('keeps the loading view visible while the runtime synchronizes', () => {
    const RuntimeRoute = routeOptions.current?.component as () => React.ReactElement

    render(<RuntimeRoute />)

    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy()
  })

  it('sanitizes unclassified errors and offers a reconnect action', () => {
    render(
      <ConnectionRouteError
        error={new Error('secret server detail')}
        info={{ componentStack: '' }}
        reset={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert').textContent).not.toContain('secret server detail')
    expect(screen.getByText('Connection interrupted')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }))
    expect(connectionRecovery.reload).toHaveBeenCalledOnce()
  })

  it('automatically reloads an unclassified connection error once', () => {
    connectionRecovery.begin.mockReturnValueOnce(true)

    render(
      <ConnectionRouteError
        error={new Error('stale runtime state')}
        info={{ componentStack: '' }}
        reset={vi.fn()}
      />,
    )

    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy()
    expect(connectionRecovery.begin).toHaveBeenCalledOnce()
    expect(connectionRecovery.reload).toHaveBeenCalledOnce()
  })

  it('shows sanitized technical details for schema catalogue failures', () => {
    const error = createSchemaCatalogueLoadError(
      new Error(
        'Schema hashes fetch failed: 503 appId=hidden-app adminSecret=must-not-leak body=private-response',
      ),
      { attempts: 3, serverUrl: 'https://v2.sync.jazz.tools/private-path' },
    )

    render(<ConnectionRouteError error={error} info={{ componentStack: '' }} reset={vi.fn()} />)

    expect(screen.getByText('Jazz server is unavailable')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Technical details' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy technical details' })).toBeTruthy()
  })

  it('automatically reloads an exhausted network failure once', () => {
    connectionRecovery.begin.mockReturnValueOnce(true)
    const error = createSchemaCatalogueLoadError(new TypeError('Failed to fetch'), {
      attempts: 3,
      serverUrl: 'https://v2.sync.jazz.tools',
    })
    render(<ConnectionRouteError error={error} info={{ componentStack: '' }} reset={vi.fn()} />)

    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy()
    expect(connectionRecovery.begin).toHaveBeenCalledOnce()
    expect(connectionRecovery.reload).toHaveBeenCalledOnce()
  })

  it('shows the terminal error after automatic recovery was already attempted', () => {
    const error = createSchemaCatalogueLoadError(new TypeError('Failed to fetch'), {
      attempts: 3,
      serverUrl: 'https://v2.sync.jazz.tools',
    })
    render(<ConnectionRouteError error={error} info={{ componentStack: '' }} reset={vi.fn()} />)

    expect(screen.getByText('Jazz server connection failed')).toBeTruthy()
    expect(connectionRecovery.reload).not.toHaveBeenCalled()
  })

  it('automatically recovers when browser connectivity returns', () => {
    const online = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)
    connectionRecovery.begin.mockReturnValueOnce(true)
    const error = createSchemaCatalogueLoadError(new TypeError('Failed to fetch'), {
      attempts: 3,
      serverUrl: 'https://v2.sync.jazz.tools',
    })
    render(<ConnectionRouteError error={error} info={{ componentStack: '' }} reset={vi.fn()} />)

    expect(connectionRecovery.begin).not.toHaveBeenCalled()
    online.mockReturnValue(true)
    fireEvent(window, new Event('online'))

    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy()
    expect(connectionRecovery.begin).toHaveBeenCalledOnce()
    expect(connectionRecovery.reload).toHaveBeenCalledOnce()
    online.mockRestore()
  })

  it('does not automatically recover rejected credentials when connectivity changes', () => {
    const error = createSchemaCatalogueLoadError(
      new Error('Schema hashes fetch failed: 403 Forbidden'),
      { attempts: 1, serverUrl: 'https://v2.sync.jazz.tools' },
    )
    render(<ConnectionRouteError error={error} info={{ componentStack: '' }} reset={vi.fn()} />)

    fireEvent(window, new Event('online'))

    expect(connectionRecovery.begin).not.toHaveBeenCalled()
    expect(connectionRecovery.reload).not.toHaveBeenCalled()
  })
})
