import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { StoredConnection } from '@app/connections/connections'
import { useSubscriptionTelemetry } from '@queries/telemetry/useSubscriptionTelemetry'

const fetchServerSubscriptions = vi.hoisted(() => vi.fn())
const session = vi.hoisted(() => ({ activeConnection: null as StoredConnection | null }))

vi.mock('jazz-tools', () => ({ fetchServerSubscriptions }))
vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => session,
}))

afterEach(cleanup)

describe('useSubscriptionTelemetry', () => {
  it('does not retain cached telemetry after the connection profile is replaced', async () => {
    const connection = {
      id: 'connection-1',
      name: 'Local app',
      serverUrl: 'https://sync.example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
    }
    session.activeConnection = connection
    fetchServerSubscriptions.mockResolvedValueOnce({
      generatedAt: 1,
      queries: [{ query: 'accounts' }],
    })
    const first = renderHook(() => useSubscriptionTelemetry())
    await waitFor(() => expect(first.result.current.rows).toEqual([{ query: 'accounts' }]))
    first.unmount()

    fetchServerSubscriptions.mockImplementation(() => new Promise(() => {}))
    const cached = renderHook(() => useSubscriptionTelemetry())
    expect(cached.result.current.rows).toEqual([{ query: 'accounts' }])
    cached.unmount()

    session.activeConnection = { ...connection }
    const second = renderHook(() => useSubscriptionTelemetry())

    expect(second.result.current.rows).toEqual([])
  })
})
