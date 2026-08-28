import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { atom } from 'nanostores'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  InspectorProvider,
  useRuntimeRetry,
  useRuntimeSchema,
} from '@app/providers/inspectorProvider'
import type { StoredConnection } from '@app/connections/connections'

const runtimeHolder = vi.hoisted(() => ({ current: null as unknown }))
const runtimeOptionsHolder = vi.hoisted(() => ({ current: null as unknown }))
const sessionHolder = vi.hoisted(() => ({ current: null as unknown }))
const wasmPreparationHolder = vi.hoisted(() => ({ current: null as Promise<void> | null }))
const jazzReactMocks = vi.hoisted(() => ({
  clients: new Map<string, { manager: object }>(),
  errors: new Map<string, Error>(),
  provider: vi.fn(),
  subscriptions: new Map<string, Set<(client: { manager: object }) => void>>(),
}))

const runtime = {
  $client: atom(null),
  $error: atom<string | null>(null),
  $isWasmSchemaLoading: atom(false),
  $schemaCatalogue: atom<Array<{ hash: string; publishedAt: number | null }>>([]),
  $storedPermissions: atom<unknown>(null),
  $wasmSchema: atom<Record<string, { columns: [] }> | null>({ accounts: { columns: [] } }),
  clearClient: vi.fn(),
  publishClient: vi.fn(),
  publishClientError: vi.fn(),
}
runtimeHolder.current = runtime

const session = {
  connections: [],
  activeConnection: null as StoredConnection | null,
  currentConnectionId: 'connection-1',
  currentBranch: 'main',
  currentSchemaHash: 'schema-1',
  currentTableName: 'accounts',
  connectionLabel: 'Local app',
  rememberedBranches: [],
  openConnection: vi.fn(),
  switchBranch: vi.fn(),
  switchSchema: vi.fn(),
  deleteConnection: vi.fn(),
  setConnectionContext: vi.fn(),
  prefill: null,
}
sessionHolder.current = session

vi.mock('@app/runtime/useInspectorRuntime', () => ({
  useInspectorRuntime: (options: unknown) => {
    runtimeOptionsHolder.current = options
    return runtimeHolder.current
  },
}))

vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: () => sessionHolder.current,
}))

vi.mock('@app/runtime/jazzWasmPreparation', () => ({
  getJazzWasmPreparation: () => wasmPreparationHolder.current,
}))

vi.mock('jazz-tools/react', async () => {
  const React = await import('react')
  const ClientContext = React.createContext<{ manager: object } | null>(null)
  function JazzProvider({
    autoAttachDevTools,
    children,
    config,
  }: {
    autoAttachDevTools?: boolean
    children: React.ReactNode
    config: { adminSecret: string; appId: string; userBranch: string }
  }) {
    jazzReactMocks.provider({ autoAttachDevTools, config })
    const clientKey = `${config.appId}:${config.userBranch}:${config.adminSecret}`
    const error = jazzReactMocks.errors.get(clientKey)
    if (error !== undefined) throw error
    const [client, setClient] = React.useState(() => jazzReactMocks.clients.get(clientKey))
    React.useEffect(() => {
      const listeners = jazzReactMocks.subscriptions.get(clientKey) ?? new Set()
      listeners.add(setClient)
      jazzReactMocks.subscriptions.set(clientKey, listeners)
      setClient(jazzReactMocks.clients.get(clientKey))
      return () => {
        listeners.delete(setClient)
      }
    }, [clientKey])
    if (client === undefined) return null
    return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
  }

  return {
    JazzProvider,
    useJazzClient: () => React.useContext(ClientContext)!,
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  runtime.$schemaCatalogue.set([])
  runtime.$storedPermissions.set(null)
  runtime.$error.set(null)
  runtime.$wasmSchema.set({ accounts: { columns: [] } })
  runtime.$isWasmSchemaLoading.set(false)
  runtime.clearClient.mockClear()
  runtime.publishClient.mockClear()
  runtime.publishClientError.mockClear()
  jazzReactMocks.provider.mockClear()
  jazzReactMocks.clients.clear()
  jazzReactMocks.errors.clear()
  jazzReactMocks.subscriptions.clear()
  session.activeConnection = null
  session.currentConnectionId = 'connection-1'
  session.currentBranch = 'main'
  session.currentSchemaHash = 'schema-1'
  runtimeHolder.current = runtime
  runtimeOptionsHolder.current = null
  wasmPreparationHolder.current = null
})

describe('InspectorProvider runtime projections', () => {
  it('does not start the Jazz provider until accepted-intent WASM preparation settles', async () => {
    let settlePreparation!: () => void
    wasmPreparationHolder.current = new Promise((resolve) => {
      settlePreparation = resolve
    })
    session.activeConnection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    }

    render(<InspectorProvider>Workspace</InspectorProvider>)

    expect(jazzReactMocks.provider).not.toHaveBeenCalled()
    act(settlePreparation)
    await waitFor(() => expect(jazzReactMocks.provider).toHaveBeenCalledOnce())
  })

  it('retains the connection catalogue after the selected schema changes', () => {
    session.currentSchemaHash = 'schema-2'
    const schemaCatalogue = [
      { hash: 'schema-2', publishedAt: 2 },
      { hash: 'schema-1', publishedAt: 1 },
    ]

    render(
      <InspectorProvider
        initialRuntimeTarget={{
          connectionId: 'connection-1',
          branch: 'main',
          schemaHash: 'schema-1',
          schemaCatalogue,
        }}
      >
        Workspace
      </InspectorProvider>,
    )

    expect(runtimeOptionsHolder.current).toEqual(
      expect.objectContaining({ initialSchemaCatalogue: schemaCatalogue }),
    )
  })

  it('retries a runtime failure that appears after the document resumes', async () => {
    const visibilityState = vi.spyOn(document, 'visibilityState', 'get')
    visibilityState.mockReturnValue('hidden')
    render(<InspectorProvider>Workspace</InspectorProvider>)

    fireEvent(document, new Event('visibilitychange'))
    visibilityState.mockReturnValue('visible')
    fireEvent(document, new Event('visibilitychange'))
    act(() => {
      runtime.$error.set('Client failed')
    })

    await waitFor(() =>
      expect(runtimeOptionsHolder.current).toEqual(expect.objectContaining({ retryGeneration: 1 })),
    )
  })

  it('recovers the same client configuration through the runtime retry action', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    session.activeConnection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    }
    const clientError = new Error('Client failed')
    const client = { manager: {} }
    jazzReactMocks.errors.set('app-1:main:secret', clientError)
    jazzReactMocks.clients.set('app-1:main:secret', client)
    function RetryControl() {
      const retryRuntime = useRuntimeRetry()
      return <button onClick={retryRuntime}>Retry runtime</button>
    }

    render(
      <InspectorProvider>
        <RetryControl />
      </InspectorProvider>,
    )
    await waitFor(() => expect(runtime.publishClientError).toHaveBeenCalledWith(clientError))
    expect(consoleError).toHaveBeenCalled()

    jazzReactMocks.errors.delete('app-1:main:secret')
    fireEvent.click(screen.getByRole('button', { name: 'Retry runtime' }))

    expect(runtimeOptionsHolder.current).toEqual(expect.objectContaining({ retryGeneration: 1 }))
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(client))
  })

  it('does not rerender a schema consumer when permissions resolve', () => {
    const onSchemaConsumerRender = vi.fn()
    function SchemaConsumer() {
      useRuntimeSchema()
      onSchemaConsumerRender()
      return null
    }

    render(
      <InspectorProvider>
        <SchemaConsumer />
      </InspectorProvider>,
    )

    act(() => {
      runtime.$storedPermissions.set({ permissions: {}, head: null })
    })
    expect(onSchemaConsumerRender).toHaveBeenCalledOnce()

    act(() => {
      runtime.$wasmSchema.set({ users: { columns: [] } })
    })
    expect(onSchemaConsumerRender).toHaveBeenCalledTimes(2)
  })

  it("publishes clients through Jazz's registry-backed React provider", async () => {
    session.activeConnection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    }
    const client = { manager: {} }
    jazzReactMocks.clients.set('app-1:main:secret', client)

    render(
      <InspectorProvider>
        <div>Structural workspace</div>
      </InspectorProvider>,
    )

    expect(jazzReactMocks.provider).toHaveBeenCalledOnce()
    expect(jazzReactMocks.provider).toHaveBeenCalledWith({
      autoAttachDevTools: false,
      config: {
        appId: 'app-1',
        serverUrl: 'https://example.com',
        env: 'dev',
        userBranch: 'main',
        adminSecret: 'secret',
        driver: { type: 'memory' },
      },
    })
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(client))
  })

  it('does not publish a client until the selected stored schema is verified', async () => {
    session.activeConnection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    }
    const client = { manager: {} }
    jazzReactMocks.clients.set('app-1:main:secret', client)
    runtime.$isWasmSchemaLoading.set(true)

    render(<InspectorProvider>Workspace</InspectorProvider>)

    expect(runtime.publishClient).not.toHaveBeenCalled()

    act(() => {
      runtime.$isWasmSchemaLoading.set(false)
    })

    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(client))
  })

  it('never publishes a retained client into a replacement runtime', async () => {
    const clientA = { manager: { connection: 'a' } }
    const clientB = { manager: { connection: 'b' } }
    jazzReactMocks.clients.set('app-a:main:secret-a', clientA)
    jazzReactMocks.clients.set('app-b:main:secret-b', clientB)
    session.activeConnection = {
      id: 'connection-a',
      name: 'App A',
      serverUrl: 'https://a.example.com',
      appId: 'app-a',
      adminSecret: 'secret-a',
      env: 'dev',
    }
    const runtimeB = { ...runtime, clearClient: vi.fn(), publishClient: vi.fn() }
    const { rerender } = render(<InspectorProvider>Workspace</InspectorProvider>)
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(clientA))

    session.activeConnection = {
      id: 'connection-b',
      name: 'App B',
      serverUrl: 'https://b.example.com',
      appId: 'app-b',
      adminSecret: 'secret-b',
      env: 'dev',
    }
    session.currentConnectionId = 'connection-b'
    runtimeHolder.current = runtimeB
    rerender(<InspectorProvider>Workspace</InspectorProvider>)

    await waitFor(() => expect(runtimeB.publishClient).toHaveBeenCalledWith(clientB))
    expect(runtimeB.publishClient).not.toHaveBeenCalledWith(clientA)
  })

  it('keeps a replacement runtime clientless until its matching client resolves', async () => {
    const clientA = { manager: { connection: 'a' } }
    const clientB = { manager: { connection: 'b' } }
    jazzReactMocks.clients.set('app-a:main:secret-a', clientA)
    session.activeConnection = {
      id: 'connection-a',
      name: 'App A',
      serverUrl: 'https://a.example.com',
      appId: 'app-a',
      adminSecret: 'secret-a',
      env: 'dev',
    }
    const runtimeB = { ...runtime, clearClient: vi.fn(), publishClient: vi.fn() }
    const { rerender } = render(<InspectorProvider>Workspace</InspectorProvider>)
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(clientA))

    session.activeConnection = {
      id: 'connection-b',
      name: 'App B',
      serverUrl: 'https://b.example.com',
      appId: 'app-b',
      adminSecret: 'secret-b',
      env: 'dev',
    }
    session.currentConnectionId = 'connection-b'
    runtimeHolder.current = runtimeB
    rerender(<InspectorProvider>Workspace</InspectorProvider>)

    expect(runtimeB.publishClient).not.toHaveBeenCalled()

    act(() => {
      jazzReactMocks.clients.set('app-b:main:secret-b', clientB)
      for (const publish of jazzReactMocks.subscriptions.get('app-b:main:secret-b') ?? []) {
        publish(clientB)
      }
    })

    await waitFor(() => expect(runtimeB.publishClient).toHaveBeenCalledWith(clientB))
    expect(runtimeB.publishClient).not.toHaveBeenCalledWith(clientA)
  })

  it('never publishes a retained branch client into a replacement runtime', async () => {
    const mainClient = { manager: { branch: 'main' } }
    const featureClient = { manager: { branch: 'feature' } }
    jazzReactMocks.clients.set('app-1:main:secret', mainClient)
    jazzReactMocks.clients.set('app-1:feature:secret', featureClient)
    session.activeConnection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    }
    const featureRuntime = { ...runtime, clearClient: vi.fn(), publishClient: vi.fn() }
    const { rerender } = render(<InspectorProvider>Workspace</InspectorProvider>)
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(mainClient))

    session.currentBranch = 'feature'
    runtimeHolder.current = featureRuntime
    rerender(<InspectorProvider>Workspace</InspectorProvider>)

    await waitFor(() => expect(featureRuntime.publishClient).toHaveBeenCalledWith(featureClient))
    expect(featureRuntime.publishClient).not.toHaveBeenCalledWith(mainClient)
  })

  it('remounts by non-sensitive profile identity when credentials change under one saved id', async () => {
    const previousClient = { manager: { credential: 'previous' } }
    const replacementClient = { manager: { credential: 'replacement' } }
    jazzReactMocks.clients.set('app-1:main:secret-a', previousClient)
    jazzReactMocks.clients.set('app-1:main:secret-b', replacementClient)
    session.activeConnection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret-a',
      env: 'dev',
    }
    const replacementRuntime = { ...runtime, clearClient: vi.fn(), publishClient: vi.fn() }
    const { rerender } = render(<InspectorProvider>Workspace</InspectorProvider>)
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(previousClient))

    session.activeConnection = { ...session.activeConnection, adminSecret: 'secret-b' }
    runtimeHolder.current = replacementRuntime
    rerender(<InspectorProvider>Workspace</InspectorProvider>)

    await waitFor(() =>
      expect(replacementRuntime.publishClient).toHaveBeenCalledWith(replacementClient),
    )
    expect(replacementRuntime.publishClient).not.toHaveBeenCalledWith(previousClient)
  })
})
