import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { StoredConnection } from '@app/connections/connections'

import { useAddConnectionFlow } from './useAddConnectionFlow'

const { fetchSchemaHashes, navigate, saveConnection, setConnectionContext } = vi.hoisted(() => ({
  fetchSchemaHashes: vi.fn(),
  navigate: vi.fn(),
  saveConnection: vi.fn((draft, connectionId = 'connection-1') => ({
    ...draft,
    id: connectionId,
  })),
  setConnectionContext: vi.fn(),
}))
let connections: StoredConnection[] = []

vi.mock('jazz-tools', () => ({ fetchSchemaHashes }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))
vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: () => ({
    connections,
    prefill: null,
    saveConnection,
    setConnectionContext,
  }),
}))

afterEach(() => {
  cleanup()
  connections = []
  fetchSchemaHashes.mockReset()
  navigate.mockReset()
  saveConnection.mockClear()
  setConnectionContext.mockReset()
  vi.restoreAllMocks()
})

describe('useAddConnectionFlow', () => {
  it('starts only one schema request when submission overlaps synchronously', () => {
    fetchSchemaHashes.mockReturnValue(new Promise(() => undefined))
    const { result } = renderHook(() => useAddConnectionFlow())

    act(() => {
      result.current.updateField('serverUrl', 'https://self-hosted.example.com')
      result.current.updateField('appId', 'self-hosted-app')
      result.current.updateField('adminSecret', 'secret')
    })
    act(() => {
      void result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
      void result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
    })

    expect(fetchSchemaHashes).toHaveBeenCalledTimes(1)
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
    const { result } = renderHook(() => useAddConnectionFlow())

    act(() => {
      result.current.updateField('serverUrl', 'https://self-hosted.example.com')
      result.current.updateField('appId', 'self-hosted-app')
      result.current.updateField('adminSecret', 'secret')
    })
    await act(async () => {
      await result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
    })

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
    fetchSchemaHashes.mockResolvedValueOnce({
      hashes: ['schema-1'],
      schemas: [{ hash: 'schema-1', publishedAt: 1 }],
    })
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

    expect(saveConnection).toHaveBeenCalledWith(
      {
        name: 'Production app',
        serverUrl: 'https://self-hosted.example.com',
        appId: 'production-app',
        adminSecret: 'production-secret',
        env: 'prod',
      },
      'connection-2',
    )
    expect(setConnectionContext).toHaveBeenCalledWith('connection-2', 'release', 'schema-1')
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
    fetchSchemaHashes.mockResolvedValue({
      hashes: ['schema-1'],
      schemas: [{ hash: 'schema-1', publishedAt: 1 }],
    })
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
    expect(saveConnection).not.toHaveBeenCalled()
    expect(setConnectionContext).toHaveBeenCalledWith('connection-1', 'release', 'schema-1')
    expect(navigate).toHaveBeenCalledWith({
      to: '/conn/$connectionId/tables',
      params: { connectionId: 'connection-1' },
    })
  })

  it('orders schema choices by publication metadata', async () => {
    fetchSchemaHashes.mockResolvedValueOnce({
      hashes: ['schema-1', 'schema-2'],
      schemas: [
        { hash: 'schema-1', publishedAt: 1 },
        { hash: 'schema-2', publishedAt: 2 },
      ],
    })
    const { result } = renderHook(() => useAddConnectionFlow())

    act(() => {
      result.current.updateField('serverUrl', 'https://self-hosted.example.com')
      result.current.updateField('appId', 'self-hosted-app')
      result.current.updateField('adminSecret', 'secret')
    })
    await act(async () => {
      await result.current.fetchSchemas({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.schemaHashes).toEqual(['schema-2', 'schema-1'])
  })
})
