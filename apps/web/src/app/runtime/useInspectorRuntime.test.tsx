import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { JazzClient } from 'jazz-tools/react'

import { useInspectorRuntime } from '@app/runtime/useInspectorRuntime'

const jazzMocks = vi.hoisted(() => ({
  fetchSchemaHashes: vi.fn(),
  fetchStoredPermissions: vi.fn(),
  fetchStoredWasmSchema: vi.fn(),
  shutdown: vi.fn(),
}))

vi.mock('jazz-tools', () => ({
  fetchSchemaHashes: jazzMocks.fetchSchemaHashes,
  fetchStoredPermissions: jazzMocks.fetchStoredPermissions,
  fetchStoredWasmSchema: jazzMocks.fetchStoredWasmSchema,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useInspectorRuntime', () => {
  it('reruns runtime metadata when the retry generation changes', async () => {
    const schemaError = new Error('Failed once')
    jazzMocks.fetchStoredWasmSchema
      .mockRejectedValueOnce(schemaError)
      .mockResolvedValueOnce({ schema: { accounts: { columns: [] } } })
    jazzMocks.fetchStoredPermissions.mockResolvedValue(null)
    const connection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    } as const

    const { result, rerender } = renderHook(
      ({ retryGeneration }: { retryGeneration: number }) =>
        useInspectorRuntime({
          connection,
          branch: 'main',
          schemaHash: 'schema-1',
          retryGeneration,
        }),
      { initialProps: { retryGeneration: 0 } },
    )

    await waitFor(() =>
      expect(result.current.$error.get()).toEqual({ source: 'schema', error: schemaError }),
    )

    const failedRuntime = result.current
    rerender({ retryGeneration: 1 })

    expect(result.current).not.toBe(failedRuntime)
    expect(result.current.$client.get()).toBeNull()
    await waitFor(() =>
      expect(result.current.$wasmSchema.get()).toEqual({ accounts: { columns: [] } }),
    )
    expect(result.current.$error.get()).toBeNull()
    expect(jazzMocks.fetchStoredWasmSchema).toHaveBeenCalledTimes(2)
  })

  it('waits for the verified stored schema instead of restoring a local projection', () => {
    const connection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    } as const
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: () =>
          JSON.stringify({ version: 1, entries: { stale: { schema: { stale: { columns: [] } } } } }),
      },
    })
    jazzMocks.fetchStoredWasmSchema.mockReturnValue(new Promise(() => undefined))
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined))

    const { result } = renderHook(() =>
      useInspectorRuntime({ connection, branch: 'main', schemaHash: 'schema-1' }),
    )

    expect(result.current.$wasmSchema.get()).toBeNull()
    expect(result.current.$isWasmSchemaLoading.get()).toBe(true)
  })

  it('exposes a fresh client projection when the branch changes', () => {
    const connection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    } as const
    jazzMocks.fetchStoredWasmSchema.mockReturnValue(new Promise(() => undefined))
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined))

    const { result, rerender } = renderHook(
      ({ branch }: { branch: string }) =>
        useInspectorRuntime({ connection, branch, schemaHash: 'schema-1' }),
      { initialProps: { branch: 'main' } },
    )
    const mainRuntime = result.current
    mainRuntime.publishClient({ shutdown: jazzMocks.shutdown } as unknown as JazzClient)

    rerender({ branch: 'feature' })

    expect(result.current).not.toBe(mainRuntime)
    expect(result.current.$client.get()).toBeNull()
    expect(result.current.$wasmSchema.get()).toBeNull()
  })

  it('does not let stale provider cleanup clear a replacement client', () => {
    const connection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    } as const
    jazzMocks.fetchStoredWasmSchema.mockReturnValue(new Promise(() => undefined))
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined))
    const { result } = renderHook(() =>
      useInspectorRuntime({ connection, branch: 'main', schemaHash: 'schema-1' }),
    )
    const previousClient = { manager: { client: 'previous' } } as unknown as JazzClient
    const replacementClient = { manager: { client: 'replacement' } } as unknown as JazzClient

    result.current.publishClient(previousClient)
    result.current.publishClient(replacementClient)
    result.current.clearClient(previousClient)

    expect(result.current.$client.get()).toBe(replacementClient)
  })

  it('publishes schema metadata without waiting for client or hash discovery', async () => {
    jazzMocks.fetchStoredWasmSchema.mockResolvedValue({
      schema: { accounts: { columns: [] } },
    })
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined))

    const { result } = renderHook(() =>
      useInspectorRuntime({
        connection: {
          id: 'connection-1',
          name: 'Local app',
          serverUrl: 'https://example.com',
          appId: 'app-1',
          adminSecret: 'secret',
          env: 'dev',
        },
        branch: 'main',
        schemaHash: 'schema-1',
      }),
    )

    await waitFor(() =>
      expect(result.current.$wasmSchema.get()).toEqual({ accounts: { columns: [] } }),
    )
    expect(result.current.$client.get()).toBeNull()
    expect(jazzMocks.fetchStoredWasmSchema).toHaveBeenCalledWith('https://example.com', {
      appId: 'app-1',
      adminSecret: 'secret',
      schemaHash: 'schema-1',
    })
  })

  it('does not let optional permissions block the usable runtime', async () => {
    jazzMocks.fetchStoredWasmSchema.mockResolvedValue({ schema: { tables: {} } })
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined))

    const { result } = renderHook(() =>
      useInspectorRuntime({
        connection: {
          id: 'connection-1',
          name: 'Local app',
          serverUrl: 'https://example.com',
          appId: 'app-1',
          adminSecret: 'secret',
          env: 'dev',
        },
        branch: 'main',
        schemaHash: 'schema-1',
      }),
    )

    result.current.publishClient({ shutdown: jazzMocks.shutdown } as unknown as JazzClient)
    await waitFor(() => expect(result.current.$wasmSchema.get()).toEqual({ tables: {} }))
    expect(result.current.$storedPermissions.get()).toBeNull()
  })

  it('does not repeat schema discovery when the route catalogue is unavailable', async () => {
    jazzMocks.fetchStoredWasmSchema.mockResolvedValue({ schema: { tables: {} } })
    jazzMocks.fetchStoredPermissions.mockReturnValue(new Promise(() => undefined))

    const { result } = renderHook(() =>
      useInspectorRuntime({
        connection: {
          id: 'connection-1',
          name: 'Local app',
          serverUrl: 'https://example.com',
          appId: 'app-1',
          adminSecret: 'secret',
          env: 'dev',
        },
        branch: 'main',
        schemaHash: 'schema-1',
      }),
    )

    result.current.publishClient({ shutdown: jazzMocks.shutdown } as unknown as JazzClient)
    await waitFor(() => expect(result.current.$wasmSchema.get()).toEqual({ tables: {} }))

    expect(result.current.$schemaCatalogue.get()).toEqual([])
    expect(jazzMocks.fetchSchemaHashes).not.toHaveBeenCalled()
  })

  it('reuses schema hashes resolved by the connection loader', async () => {
    jazzMocks.fetchStoredWasmSchema.mockResolvedValue({ schema: { tables: {} } })
    jazzMocks.fetchStoredPermissions.mockResolvedValue(null)

    const { result } = renderHook(() =>
      useInspectorRuntime({
        connection: {
          id: 'connection-1',
          name: 'Local app',
          serverUrl: 'https://example.com',
          appId: 'app-1',
          adminSecret: 'secret',
          env: 'dev',
        },
        branch: 'main',
        schemaHash: 'schema-1',
        initialSchemaCatalogue: [
          { hash: 'schema-1', publishedAt: 1 },
          { hash: 'schema-2', publishedAt: 2 },
        ],
      }),
    )

    expect(result.current.$schemaCatalogue.get()).toEqual([
      { hash: 'schema-1', publishedAt: 1 },
      { hash: 'schema-2', publishedAt: 2 },
    ])
    expect(jazzMocks.fetchSchemaHashes).not.toHaveBeenCalled()
  })
})
