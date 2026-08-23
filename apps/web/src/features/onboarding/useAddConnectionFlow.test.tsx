import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAddConnectionFlow } from './useAddConnectionFlow'

const { fetchSchemaHashes, navigate, saveConnection } = vi.hoisted(() => ({
  fetchSchemaHashes: vi.fn(),
  navigate: vi.fn(),
  saveConnection: vi.fn(() => ({
    id: 'connection-1',
    name: 'Example',
    serverUrl: 'https://self-hosted.example.com',
    appId: 'self-hosted-app',
    adminSecret: 'secret',
    env: 'dev',
  })),
}))

vi.mock('jazz-tools', () => ({ fetchSchemaHashes }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))
vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: () => ({
    connections: [],
    prefill: null,
    saveConnection,
    setConnectionContext: vi.fn(),
  }),
}))

afterEach(() => {
  cleanup()
  fetchSchemaHashes.mockReset()
  navigate.mockReset()
  saveConnection.mockClear()
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

  it('distinguishes navigation failures after successful validation', async () => {
    fetchSchemaHashes.mockResolvedValueOnce({ hashes: ['schema-1'] })
    navigate.mockRejectedValueOnce(new Error('router failed'))
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
      title: "Couldn't open this connection",
      description: 'Try again.',
    })
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
})
