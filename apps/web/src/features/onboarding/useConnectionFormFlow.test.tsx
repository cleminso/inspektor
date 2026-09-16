import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { StoredConnection } from '@app/connections/connections'

import { useConnectionFormFlow } from './useConnectionFormFlow'

const {
  fetchSchemaCatalogue,
  handoffStoredRuntimeTarget,
  navigate,
  prepareJazzWasm,
  saveConnectionWithContext,
  setConnectionContext,
} = vi.hoisted(() => ({
  fetchSchemaCatalogue: vi.fn(),
  handoffStoredRuntimeTarget: vi.fn(),
  navigate: vi.fn(),
  prepareJazzWasm: vi.fn(),
  saveConnectionWithContext: vi.fn(),
  setConnectionContext: vi.fn(),
}))
let connections: StoredConnection[] = []
const singleSchemaResponse = [{ hash: 'schema-1', publishedAt: 1 }]
const schemaChoicesResponse = [
  { hash: 'schema-1', publishedAt: 1 },
  { hash: 'schema-2', publishedAt: 2 },
]

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))
vi.mock('@app/runtime/jazzWasmPreparation', () => ({ prepareJazzWasm }))
vi.mock('@app/routing/inspectorNavigation', () => ({
  fetchConnectionSchemaCatalogue: fetchSchemaCatalogue,
  handoffStoredRuntimeTarget,
}))
vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: () => ({
    connections,
    saveConnectionWithContext,
    setConnectionContext,
  }),
}))

afterEach(() => {
  cleanup()
  connections = []
  fetchSchemaCatalogue.mockReset()
  handoffStoredRuntimeTarget.mockReset()
  navigate.mockReset()
  prepareJazzWasm.mockReset()
  saveConnectionWithContext.mockClear()
  setConnectionContext.mockReset()
  vi.restoreAllMocks()
})

beforeEach(() => {
  saveConnectionWithContext.mockReturnValue('accepted')
  setConnectionContext.mockReturnValue('accepted')
})

function renderValidConnectionFormFlow() {
  const hook = renderHook(() => useConnectionFormFlow())

  act(() => {
    hook.result.current.updateFieldValue('serverUrl', 'https://self-hosted.example.com')
    hook.result.current.updateFieldValue('appId', 'self-hosted-app')
    hook.result.current.updateFieldValue('adminSecret', 'secret')
  })

  return hook
}

async function submitValidConnectionForm() {
  const hook = renderValidConnectionFormFlow()

  await act(async () => {
    await hook.result.current.submitConnectionForm({ preventDefault: vi.fn() } as never)
  })

  return hook
}

describe('useConnectionFormFlow', () => {
  it('does not save or navigate when connection persistence is blocked', async () => {
    fetchSchemaCatalogue.mockResolvedValueOnce(singleSchemaResponse)
    saveConnectionWithContext.mockReturnValueOnce('blocked')
    const { result } = await submitValidConnectionForm()

    expect(setConnectionContext).not.toHaveBeenCalled()
    expect(saveConnectionWithContext).toHaveBeenCalledOnce()
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('does not set context or navigate when connection persistence fails', async () => {
    fetchSchemaCatalogue.mockResolvedValueOnce(singleSchemaResponse)
    saveConnectionWithContext.mockImplementationOnce(() => {
      throw new Error('Storage unavailable')
    })
    const { result } = await submitValidConnectionForm()

    expect(setConnectionContext).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.error?.title).toBe("Couldn't connect to this app")
  })

  it('uses one connection ID when saving and opening a new connection', async () => {
    fetchSchemaCatalogue.mockResolvedValueOnce(singleSchemaResponse)
    await submitValidConnectionForm()

    const connectionId = saveConnectionWithContext.mock.calls[0]?.[1]
    expect(connectionId).toEqual(expect.any(String))
    expect(saveConnectionWithContext).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'self-hosted-app' }),
      connectionId,
      'main',
      'schema-1',
    )
    expect(navigate).toHaveBeenCalledWith({
      to: '/conn/$connectionId/tables',
      params: { connectionId },
    })
    expect(handoffStoredRuntimeTarget).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'self-hosted-app' }),
      {
        branch: 'main',
        connectionId,
        schemaCatalogue: [{ hash: 'schema-1', publishedAt: 1 }],
        schemaHash: 'schema-1',
      },
    )
  })

  it('starts only one schema request when submission overlaps synchronously', () => {
    fetchSchemaCatalogue.mockReturnValue(new Promise(() => undefined))
    const { result } = renderValidConnectionFormFlow()
    act(() => {
      void result.current.submitConnectionForm({ preventDefault: vi.fn() } as never)
      void result.current.submitConnectionForm({ preventDefault: vi.fn() } as never)
    })

    expect(fetchSchemaCatalogue).toHaveBeenCalledTimes(1)
    expect(prepareJazzWasm).toHaveBeenCalledTimes(1)
  })

  it('starts WASM preparation alongside catalogue discovery after local validation', () => {
    fetchSchemaCatalogue.mockReturnValue(new Promise(() => undefined))
    const { result } = renderValidConnectionFormFlow()

    act(() => {
      void result.current.submitConnectionForm({ preventDefault: vi.fn() } as never)
    })

    expect(prepareJazzWasm).toHaveBeenCalledOnce()
    expect(fetchSchemaCatalogue).toHaveBeenCalledOnce()
    expect(prepareJazzWasm.mock.invocationCallOrder[0]).toBeLessThan(
      fetchSchemaCatalogue.mock.invocationCallOrder[0]!,
    )
  })

  it('keeps submission pending until connection navigation settles', async () => {
    fetchSchemaCatalogue.mockResolvedValueOnce(singleSchemaResponse)
    let settleNavigation: () => void = () => undefined
    navigate.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        settleNavigation = resolve
      }),
    )
    const { result } = renderValidConnectionFormFlow()
    act(() => {
      void result.current.submitConnectionForm({ preventDefault: vi.fn() } as never)
    })

    await waitFor(() => expect(navigate).toHaveBeenCalledOnce())
    expect(result.current.isSubmitting).toBe(true)

    act(() => {
      settleNavigation()
    })
    await waitFor(() => expect(result.current.isSubmitting).toBe(false))
  })

  it('reports invalid URLs on the server URL field without fetching', async () => {
    const { result } = renderHook(() => useConnectionFormFlow())

    act(() => {
      result.current.updateFieldValue('serverUrl', 'ftp://example.com')
      result.current.updateFieldValue('appId', 'self-hosted-app')
      result.current.updateFieldValue('adminSecret', 'secret')
    })
    await act(async () => {
      await result.current.submitConnectionForm({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.error).toEqual({
      title: 'Invalid server URL',
      description: 'Enter a valid HTTP or HTTPS URL.',
      field: 'serverUrl',
    })
    expect(fetchSchemaCatalogue).not.toHaveBeenCalled()
    expect(prepareJazzWasm).not.toHaveBeenCalled()
  })

  it('keeps normalized fetch failures after a field is edited', async () => {
    fetchSchemaCatalogue.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { result } = await submitValidConnectionForm()

    expect(result.current.error).toEqual({
      title: "Couldn't connect to this app",
      description: 'Check the server URL, app ID, and admin secret.',
    })

    act(() => result.current.updateFieldValue('appId', 'another-app'))

    await waitFor(() => expect(result.current.error?.title).toBe("Couldn't connect to this app"))
  })

  it('clears only a matching field validation error when that field is edited', async () => {
    const { result } = renderHook(() => useConnectionFormFlow())

    act(() => {
      result.current.updateFieldValue('serverUrl', 'ftp://example.com')
      result.current.updateFieldValue('appId', 'self-hosted-app')
      result.current.updateFieldValue('adminSecret', 'secret')
    })
    await act(async () => {
      await result.current.submitConnectionForm({ preventDefault: vi.fn() } as never)
    })

    act(() => result.current.updateFieldValue('appId', 'another-app'))
    expect(result.current.error?.field).toBe('serverUrl')

    act(() => result.current.updateFieldValue('serverUrl', 'https://example.com'))
    expect(result.current.error).toBeNull()
  })

  it('prefills and updates the same saved connection when editing', async () => {
    fetchSchemaCatalogue.mockResolvedValueOnce(singleSchemaResponse)
    const connection = {
      id: 'connection-2',
      name: 'Production',
      serverUrl: 'https://self-hosted.example.com',
      appId: 'production-app',
      adminSecret: 'production-secret',
      env: 'prod',
    }
    const { result } = renderHook(() => useConnectionFormFlow({ connection, branch: 'release' }))

    expect(result.current.formValues).toEqual({
      name: 'Production',
      serverUrl: 'https://self-hosted.example.com',
      appId: 'production-app',
      adminSecret: 'production-secret',
      env: 'prod',
      branch: 'release',
    })

    act(() => result.current.updateFieldValue('name', 'Production app'))
    await act(async () => {
      await result.current.submitConnectionForm({ preventDefault: vi.fn() } as never)
    })

    expect(saveConnectionWithContext).toHaveBeenCalledWith(
      {
        name: 'Production app',
        serverUrl: 'https://self-hosted.example.com',
        appId: 'production-app',
        adminSecret: 'production-secret',
        env: 'prod',
      },
      'connection-2',
      'release',
      'schema-1',
    )
    expect(navigate).toHaveBeenCalledWith({
      to: '/conn/$connectionId/tables',
      params: { connectionId: 'connection-2' },
    })
  })

  it('opens an existing saved connection when edited credentials match it', async () => {
    const connection = {
      id: 'connection-2',
      name: 'Production',
      serverUrl: 'https://self-hosted.example.com',
      appId: 'production-app',
      adminSecret: 'production-secret',
      env: 'prod',
    }
    connections = [
      connection,
      {
        id: 'connection-1',
        name: 'Existing',
        serverUrl: 'https://existing.example.com',
        appId: 'existing-app',
        adminSecret: 'existing-secret',
        env: 'dev',
      },
    ]
    fetchSchemaCatalogue.mockResolvedValue(singleSchemaResponse)
    const { result } = renderHook(() => useConnectionFormFlow({ connection, branch: 'release' }))

    act(() => {
      result.current.updateFieldValue('serverUrl', 'https://existing.example.com')
      result.current.updateFieldValue('appId', 'existing-app')
      result.current.updateFieldValue('adminSecret', 'existing-secret')
    })
    await act(async () => {
      await result.current.submitConnectionForm({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.error).toBeNull()
    expect(fetchSchemaCatalogue).toHaveBeenCalledWith({
      serverUrl: 'https://existing.example.com',
      appId: 'existing-app',
      adminSecret: 'existing-secret',
    })
    expect(saveConnectionWithContext).not.toHaveBeenCalled()
    expect(setConnectionContext).toHaveBeenCalledWith('connection-1', 'release', 'schema-1')
    expect(prepareJazzWasm).toHaveBeenCalledOnce()
    expect(prepareJazzWasm.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0]!,
    )
    expect(navigate).toHaveBeenCalledWith({
      to: '/conn/$connectionId/tables',
      params: { connectionId: 'connection-1' },
    })
  })

  it('reports when no schemas are available', async () => {
    fetchSchemaCatalogue.mockResolvedValueOnce([])

    const { result } = await submitValidConnectionForm()

    expect(result.current.error).toEqual({
      title: 'No published schemas available',
      description: 'This app has no published schemas.',
    })
    expect(saveConnectionWithContext).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens the workspace directly when multiple schemas are available', async () => {
    fetchSchemaCatalogue.mockResolvedValueOnce(schemaChoicesResponse)

    await submitValidConnectionForm()

    const connectionId = saveConnectionWithContext.mock.calls[0]?.[1]
    expect(saveConnectionWithContext).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'self-hosted-app' }),
      connectionId,
      'main',
      'schema-1',
    )
    expect(navigate).toHaveBeenCalledWith({
      to: '/conn/$connectionId/tables',
      params: { connectionId },
    })
  })
})
