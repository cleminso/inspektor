import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { atom } from 'nanostores'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  InspectorProvider,
  useRuntimeRetry,
  useRuntimeSchema,
} from '@app/providers/inspectorProvider'
import type { StoredConnection } from '@app/connections/connections'
import {
  beginAutomaticConnectionRecovery,
  clearAutomaticConnectionRecovery,
} from '@app/connections/connectionRecovery'

interface FakeClient {
  db: {
    reconnect: ReturnType<typeof vi.fn>
  }
  shutdown: ReturnType<typeof vi.fn>
}

const runtimeHolder = vi.hoisted(() => ({ current: null as unknown }))
const runtimeOptionsHolder = vi.hoisted(() => ({ current: null as unknown }))
const sessionHolder = vi.hoisted(() => ({ current: null as unknown }))
const wasmPreparationMocks = vi.hoisted(() => ({ prepare: vi.fn() }))
const adminClientMocks = vi.hoisted(() => ({ create: vi.fn() }))

const runtime = {
  $client: atom(null),
  $error: atom<unknown>(null),
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
  prepareJazzWasm: wasmPreparationMocks.prepare,
}))

vi.mock('jazz-tools/_dev/inspector-client', () => ({
  createInspectorAdminClient: adminClientMocks.create,
}))

function connection(overrides: Partial<StoredConnection> = {}): StoredConnection {
  return {
    id: 'connection-1',
    name: 'Local app',
    serverUrl: 'https://example.com',
    appId: 'app-1',
    adminSecret: 'secret',
    env: 'dev',
    ...overrides,
  }
}

function client(): FakeClient {
  return {
    db: { reconnect: vi.fn().mockResolvedValue(undefined) },
    shutdown: vi.fn().mockResolvedValue(undefined),
  }
}

function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
} {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

async function renderPublishedClient() {
  session.activeConnection = connection()
  const createdClient = client()
  adminClientMocks.create.mockResolvedValue(createdClient)
  const view = render(<InspectorProvider>Workspace</InspectorProvider>)
  await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(createdClient))
  return { createdClient, view }
}

beforeEach(() => {
  clearAutomaticConnectionRecovery()
  runtime.$client.set(null)
  runtime.publishClient.mockImplementation((publishedClient) => {
    runtime.$client.set(publishedClient)
  })
  adminClientMocks.create.mockReset()
  wasmPreparationMocks.prepare.mockReset()
  wasmPreparationMocks.prepare.mockResolvedValue(undefined)
})

afterEach(() => {
  clearAutomaticConnectionRecovery()
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
  session.activeConnection = null
  session.currentConnectionId = 'connection-1'
  session.currentBranch = 'main'
  session.currentSchemaHash = 'schema-1'
  runtimeHolder.current = runtime
  runtimeOptionsHolder.current = null
})

describe('InspectorProvider runtime projections', () => {
  it('does not create the admin client until accepted-intent WASM preparation settles', async () => {
    let settlePreparation!: () => void
    wasmPreparationMocks.prepare.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        settlePreparation = resolve
      }),
    )
    session.activeConnection = connection()
    adminClientMocks.create.mockResolvedValue(client())

    render(<InspectorProvider>Workspace</InspectorProvider>)

    expect(adminClientMocks.create).not.toHaveBeenCalled()
    act(settlePreparation)
    await waitFor(() => expect(adminClientMocks.create).toHaveBeenCalledOnce())
  })

  it('creates and publishes a privileged client without a global branch configuration', async () => {
    expect(beginAutomaticConnectionRecovery()).toBe(true)
    session.activeConnection = connection()
    const createdClient = client()
    adminClientMocks.create.mockResolvedValue(createdClient)

    render(<InspectorProvider>Workspace</InspectorProvider>)

    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(createdClient))
    expect(beginAutomaticConnectionRecovery()).toBe(false)
    expect(adminClientMocks.create).toHaveBeenCalledWith({
      appId: 'app-1',
      serverUrl: 'https://example.com',
      env: 'dev',
      adminSecret: 'secret',
    })

    const visibilityState = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))

    expect(beginAutomaticConnectionRecovery()).toBe(true)
    visibilityState.mockRestore()
  })

  it('creates the client while the selected stored schema is verified but withholds publication', async () => {
    session.activeConnection = connection()
    runtime.$isWasmSchemaLoading.set(true)
    const createdClient = client()
    adminClientMocks.create.mockResolvedValue(createdClient)

    render(<InspectorProvider>Workspace</InspectorProvider>)
    await waitFor(() => expect(adminClientMocks.create).toHaveBeenCalledOnce())
    expect(runtime.publishClient).not.toHaveBeenCalled()

    act(() => runtime.$isWasmSchemaLoading.set(false))
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(createdClient))
  })

  it('shuts down a concurrently created client when schema verification fails', async () => {
    session.activeConnection = connection()
    runtime.$isWasmSchemaLoading.set(true)
    const createdClient = client()
    adminClientMocks.create.mockResolvedValue(createdClient)

    render(<InspectorProvider>Workspace</InspectorProvider>)
    await waitFor(() => expect(adminClientMocks.create).toHaveBeenCalledOnce())

    act(() => runtime.$error.set('Schema failed'))

    await waitFor(() => expect(createdClient.shutdown).toHaveBeenCalledOnce())
    expect(runtime.publishClient).not.toHaveBeenCalledWith(createdClient)
  })

  it('shuts down a client that resolves after its runtime was replaced', async () => {
    const pendingClient = deferred<FakeClient>()
    const staleClient = client()
    const replacementClient = client()
    adminClientMocks.create
      .mockReturnValueOnce(pendingClient.promise)
      .mockResolvedValueOnce(replacementClient)
    session.activeConnection = connection({ id: 'connection-a', appId: 'app-a' })
    const replacementRuntime = { ...runtime, clearClient: vi.fn(), publishClient: vi.fn() }
    const { rerender } = render(<InspectorProvider>Workspace</InspectorProvider>)
    await waitFor(() => expect(adminClientMocks.create).toHaveBeenCalledOnce())

    session.activeConnection = connection({ id: 'connection-b', appId: 'app-b' })
    session.currentConnectionId = 'connection-b'
    runtimeHolder.current = replacementRuntime
    rerender(<InspectorProvider>Workspace</InspectorProvider>)
    await waitFor(() =>
      expect(replacementRuntime.publishClient).toHaveBeenCalledWith(replacementClient),
    )

    act(() => pendingClient.resolve(staleClient))
    await waitFor(() => expect(staleClient.shutdown).toHaveBeenCalledOnce())
    expect(runtime.publishClient).not.toHaveBeenCalledWith(staleClient)
  })

  it('clears and shuts down the owned client on unmount', async () => {
    session.activeConnection = connection()
    const createdClient = client()
    adminClientMocks.create.mockResolvedValue(createdClient)
    const view = render(<InspectorProvider>Workspace</InspectorProvider>)
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(createdClient))

    view.unmount()

    expect(runtime.clearClient).toHaveBeenCalledWith(createdClient)
    expect(createdClient.shutdown).toHaveBeenCalledOnce()
  })

  it('recovers a rejected client creation through the runtime retry action', async () => {
    const clientError = new Error('Client failed')
    const createdClient = client()
    session.activeConnection = connection()
    adminClientMocks.create.mockRejectedValueOnce(clientError).mockResolvedValueOnce(createdClient)
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

    fireEvent.click(screen.getByRole('button', { name: 'Retry runtime' }))

    expect(runtimeOptionsHolder.current).toEqual(expect.objectContaining({ retryGeneration: 1 }))
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(createdClient))
  })

  it('publishes a WASM loading failure and retries before creating the client', async () => {
    const wasmError = new Error('WASM failed')
    const createdClient = client()
    session.activeConnection = connection()
    wasmPreparationMocks.prepare.mockRejectedValueOnce(wasmError).mockResolvedValueOnce(undefined)
    adminClientMocks.create.mockResolvedValue(createdClient)
    function RetryControl() {
      const retryRuntime = useRuntimeRetry()
      return <button onClick={retryRuntime}>Retry runtime</button>
    }

    render(
      <InspectorProvider>
        <RetryControl />
      </InspectorProvider>,
    )
    await waitFor(() => expect(runtime.publishClientError).toHaveBeenCalledWith(wasmError))
    expect(adminClientMocks.create).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Retry runtime' }))

    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(createdClient))
    expect(wasmPreparationMocks.prepare).toHaveBeenCalledTimes(2)
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
    act(() => runtime.$error.set('Client failed'))

    await waitFor(() =>
      expect(runtimeOptionsHolder.current).toEqual(expect.objectContaining({ retryGeneration: 1 })),
    )
  })

  it('reconnects a published client once after a qualifying hidden period', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0)
    const visibilityState = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const { createdClient } = await renderPublishedClient()

    visibilityState.mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    now.mockReturnValue(5 * 60 * 1000 - 1)
    visibilityState.mockReturnValue('visible')
    fireEvent(document, new Event('visibilitychange'))
    expect(createdClient.db.reconnect).not.toHaveBeenCalled()

    visibilityState.mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    now.mockReturnValue(10 * 60 * 1000 - 1)
    visibilityState.mockReturnValue('visible')
    fireEvent(document, new Event('visibilitychange'))
    fireEvent(document, new Event('visibilitychange'))

    expect(createdClient.db.reconnect).toHaveBeenCalledOnce()
  })

  it('retries the runtime when resume reconnection fails', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0)
    const visibilityState = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const reconnectError = new Error('Reconnect failed')
    runtime.publishClientError.mockImplementationOnce((error) => runtime.$error.set(error))
    const { createdClient } = await renderPublishedClient()
    createdClient.db.reconnect.mockRejectedValue(reconnectError)

    visibilityState.mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    now.mockReturnValue(5 * 60 * 1000)
    visibilityState.mockReturnValue('visible')
    fireEvent(document, new Event('visibilitychange'))

    await waitFor(() => expect(runtime.publishClientError).toHaveBeenCalledWith(reconnectError))
    expect(runtimeOptionsHolder.current).toEqual(expect.objectContaining({ retryGeneration: 1 }))
  })

  it('ignores a resume reconnection failure after the provider unmounts', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0)
    const visibilityState = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const reconnect = deferred<void>()
    const { createdClient, view } = await renderPublishedClient()
    createdClient.db.reconnect.mockReturnValue(reconnect.promise)

    visibilityState.mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    now.mockReturnValue(5 * 60 * 1000)
    visibilityState.mockReturnValue('visible')
    fireEvent(document, new Event('visibilitychange'))
    view.unmount()
    reconnect.reject(new Error('Late reconnect failure'))
    await reconnect.promise.catch(() => undefined)

    expect(runtime.publishClientError).not.toHaveBeenCalled()
  })

  it('ignores a reconnect failure from a replaced client', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0)
    const visibilityState = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const reconnect = deferred<void>()
    const { createdClient, view } = await renderPublishedClient()
    createdClient.db.reconnect.mockReturnValue(reconnect.promise)

    visibilityState.mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    now.mockReturnValue(5 * 60 * 1000)
    visibilityState.mockReturnValue('visible')
    fireEvent(document, new Event('visibilitychange'))

    const replacementClient = client()
    adminClientMocks.create.mockResolvedValue(replacementClient)
    session.activeConnection = connection({ adminSecret: 'replacement-secret' })
    view.rerender(<InspectorProvider>Workspace</InspectorProvider>)
    await waitFor(() => expect(runtime.publishClient).toHaveBeenCalledWith(replacementClient))

    reconnect.reject(new Error('Obsolete reconnect failure'))
    await reconnect.promise.catch(() => undefined)

    expect(runtime.publishClientError).not.toHaveBeenCalled()
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

    act(() => runtime.$storedPermissions.set({ permissions: {}, head: null }))
    expect(onSchemaConsumerRender).toHaveBeenCalledOnce()

    act(() => runtime.$wasmSchema.set({ users: { columns: [] } }))
    expect(onSchemaConsumerRender).toHaveBeenCalledTimes(2)
  })
})
