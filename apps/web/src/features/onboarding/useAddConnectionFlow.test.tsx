import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { StoredConnection } from '@app/connections/connections'

import { useAddConnectionFlow } from './useAddConnectionFlow'

const {
  fetchSchemaHashes,
  navigate,
  prepareJazzWasm,
  saveConnectionWithContext,
  setConnectionContext,
} = vi.hoisted(() => ({
  fetchSchemaHashes: vi.fn(),
  navigate: vi.fn(),
  prepareJazzWasm: vi.fn(),
  saveConnectionWithContext: vi.fn(),
  setConnectionContext: vi.fn(),
}))
let connections: StoredConnection[] = []
const singleSchemaResponse = {
  hashes: ['schema-1'],
  schemas: [{ hash: 'schema-1', publishedAt: 1 }],
}
const schemaChoicesResponse = {
  hashes: ['schema-1', 'schema-2'],
  schemas: [
    { hash: 'schema-1', publishedAt: 1 },
    { hash: 'schema-2', publishedAt: 2 },
  ],
}

vi.mock('jazz-tools', () => ({ fetchSchemaHashes }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))
vi.mock('@app/runtime/jazzWasmPreparation', () => ({ prepareJazzWasm }))
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
  fetchSchemaHashes.mockReset()
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

function renderValidFlow() {
  const hook = renderHook(() => useAddConnectionFlow())

  act(() => {
    hook.result.current.updateField('serverUrl', 'https://self-hosted.example.com')
    hook.result.current.updateField('appId', 'self-hosted-app')
    hook.result.current.updateField('adminSecret', 'secret')
  })

  return hook
}

async function submitValidFlow() {
  const hook = renderValidFlow()

  await act(async () => {
    await hook.result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
  })

  return hook
}

describe('useAddConnectionFlow', () => {
  it('does not save or navigate when the runtime context change is blocked', async () => {
    fetchSchemaHashes.mockResolvedValueOnce(singleSchemaResponse)
    saveConnectionWithContext.mockReturnValueOnce('blocked')
    const { result } = await submitValidFlow()

    expect(setConnectionContext).not.toHaveBeenCalled()
    expect(saveConnectionWithContext).toHaveBeenCalledOnce()
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('does not set context or navigate when connection persistence fails', async () => {
    fetchSchemaHashes.mockResolvedValueOnce(singleSchemaResponse)
    saveConnectionWithContext.mockImplementationOnce(() => {
      throw new Error('Storage unavailable')
    })
    const { result } = await submitValidFlow()

    expect(setConnectionContext).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.error?.title).toBe("Couldn't validate this connection")
  })

  it('uses one connection ID when saving and opening a new connection', async () => {
    fetchSchemaHashes.mockResolvedValueOnce(singleSchemaResponse)
    await submitValidFlow()

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
  })

  it('starts only one schema request when submission overlaps synchronously', () => {
    fetchSchemaHashes.mockReturnValue(new Promise(() => undefined))
    const { result } = renderValidFlow()
    act(() => {
      void result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
      void result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
    })

    expect(fetchSchemaHashes).toHaveBeenCalledTimes(1)
  })

  it('keeps submission pending until connection navigation settles', async () => {
    fetchSchemaHashes.mockResolvedValueOnce(singleSchemaResponse)
    let settleNavigation: () => void = () => undefined
    navigate.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        settleNavigation = resolve
      }),
    )
    const { result } = renderValidFlow()
    act(() => {
      void result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
    })

    await waitFor(() => expect(navigate).toHaveBeenCalledOnce())
    expect(result.current.isSubmitting).toBe(true)

    act(() => {
      settleNavigation()
    })
    await waitFor(() => expect(result.current.isSubmitting).toBe(false))
  })

  it('reports invalid URLs on the server URL field without fetching', async () => {
    const { result } = renderHook(() => useAddConnectionFlow())

    act(() => {
      result.current.updateField('serverUrl', 'ftp://example.com')
      result.current.updateField('appId', 'self-hosted-app')
      result.current.updateField('adminSecret', 'secret')
    })
    await act(async () => {
      await result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.error).toEqual({
      title: 'Invalid server URL',
      description: 'Enter a valid HTTP or HTTPS URL.',
      field: 'serverUrl',
    })
    expect(fetchSchemaHashes).not.toHaveBeenCalled()
  })

  it('keeps normalized fetch failures after a field is edited', async () => {
    fetchSchemaHashes.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { result } = await submitValidFlow()

    expect(result.current.error).toEqual({
      title: "Couldn't validate this connection",
      description: 'Check the server URL, app ID, and admin secret.',
    })

    act(() => result.current.updateField('appId', 'another-app'))

    await waitFor(() =>
      expect(result.current.error?.title).toBe("Couldn't validate this connection"),
    )
  })

  it('clears only a matching field validation error when that field is edited', async () => {
    const { result } = renderHook(() => useAddConnectionFlow())

    act(() => {
      result.current.updateField('serverUrl', 'ftp://example.com')
      result.current.updateField('appId', 'self-hosted-app')
      result.current.updateField('adminSecret', 'secret')
    })
    await act(async () => {
      await result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
    })

    act(() => result.current.updateField('appId', 'another-app'))
    expect(result.current.error?.field).toBe('serverUrl')

    act(() => result.current.updateField('serverUrl', 'https://example.com'))
    expect(result.current.error).toBeNull()
  })

  it('prefills and updates the same saved connection when editing', async () => {
    fetchSchemaHashes.mockResolvedValueOnce(singleSchemaResponse)
    const connection = {
      id: 'connection-2',
      name: 'Production',
      serverUrl: 'https://self-hosted.example.com',
      appId: 'production-app',
      adminSecret: 'production-secret',
      env: 'prod',
    }
    const { result } = renderHook(() => useAddConnectionFlow({ connection, branch: 'release' }))

    expect(result.current.formValues).toEqual({
      name: 'Production',
      serverUrl: 'https://self-hosted.example.com',
      appId: 'production-app',
      adminSecret: 'production-secret',
      env: 'prod',
      branch: 'release',
    })

    act(() => result.current.updateField('name', 'Production app'))
    await act(async () => {
      await result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
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
    fetchSchemaHashes.mockResolvedValue(singleSchemaResponse)
    const { result } = renderHook(() => useAddConnectionFlow({ connection, branch: 'release' }))

    act(() => {
      result.current.updateField('serverUrl', 'https://existing.example.com')
      result.current.updateField('appId', 'existing-app')
      result.current.updateField('adminSecret', 'existing-secret')
    })
    await act(async () => {
      await result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.error).toBeNull()
    expect(fetchSchemaHashes).toHaveBeenCalledWith('https://existing.example.com', {
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
    fetchSchemaHashes.mockResolvedValueOnce({ hashes: [], schemas: [] })

    const { result } = await submitValidFlow()

    expect(result.current.error).toEqual({
      title: 'No stored schemas found',
      description: 'This app has no published schema.',
    })
    expect(saveConnectionWithContext).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens the workspace directly when multiple schemas are available', async () => {
    fetchSchemaHashes.mockResolvedValueOnce(schemaChoicesResponse)

    await submitValidFlow()

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
