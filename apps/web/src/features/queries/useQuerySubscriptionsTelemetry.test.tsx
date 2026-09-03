import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ConnectionCredentials } from '@app/connections/connections'

import { useQuerySubscriptionsTelemetry } from './useQuerySubscriptionsTelemetry'

const jazzMocks = vi.hoisted(() => ({
  fetchServerSubscriptions: vi.fn(),
}))

vi.mock('jazz-tools', () => ({
  fetchServerSubscriptions: jazzMocks.fetchServerSubscriptions,
}))

const credentials: ConnectionCredentials = {
  serverUrl: 'https://example.com',
  appId: 'app-1',
  adminSecret: 'secret-1',
}

const accountsGroup = {
  groupKey: 'accounts-by-name',
  count: 2,
  table: 'accounts',
  query: '{"where":{"name":"Ada"}}',
  branches: ['main'],
  propagation: 'full' as const,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(1_000)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('useQuerySubscriptionsTelemetry', () => {
  it('requests an initial validated capture with connection credentials and memoizes projections', async () => {
    jazzMocks.fetchServerSubscriptions.mockResolvedValue({
      appId: 'app-1',
      generatedAt: 10,
      queries: [accountsGroup],
    })

    const { result, rerender } = renderHook(
      ({ connection }: { connection: ConnectionCredentials }) =>
        useQuerySubscriptionsTelemetry(connection),
      { initialProps: { connection: credentials } },
    )

    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledWith('https://example.com', {
      appId: 'app-1',
      adminSecret: 'secret-1',
    })
    expect(result.current.state.kind).toBe('initial-loading')

    await act(async () => {})

    expect(result.current.history).toEqual([
      {
        kind: 'success',
        id: expect.any(String),
        generatedAt: 10,
        groups: [accountsGroup],
      },
    ])
    expect(result.current.timeline.lanes[0]?.tracks[0]?.groupKey).toBe('accounts-by-name')
    expect(result.current.state.kind).toBe('ready')

    const timeline = result.current.timeline
    rerender({ connection: { ...credentials } })

    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(1)
    expect(result.current.timeline).toBe(timeline)
  })

  it('polls after each settlement and excludes overlapping scheduled and manual requests', async () => {
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const third = deferred<unknown>()
    jazzMocks.fetchServerSubscriptions
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise)

    const { result } = renderHook(() => useQuerySubscriptionsTelemetry(credentials))

    act(() => result.current.refresh())
    await act(async () => vi.advanceTimersByTimeAsync(20_000))
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(1)

    await act(async () => {
      first.resolve({ appId: 'app-1', generatedAt: 1, queries: [] })
      await first.promise
    })
    await act(async () => vi.advanceTimersByTimeAsync(19_999))
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(1)

    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(2)
    expect(result.current.state.kind).toBe('refreshing')

    act(() => result.current.refresh())
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(2)

    await act(async () => {
      second.resolve({ appId: 'app-1', generatedAt: 2, queries: [] })
      await second.promise
    })
    act(() => result.current.refresh())

    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(3)
    await act(async () => vi.advanceTimersByTimeAsync(20_000))
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(3)
  })

  it('clears scheduled polling while paused and restores it after a fresh resumed snapshot', async () => {
    jazzMocks.fetchServerSubscriptions.mockImplementation(() =>
      Promise.resolve({
        appId: 'app-1',
        generatedAt: jazzMocks.fetchServerSubscriptions.mock.calls.length,
        queries: [],
      }),
    )

    const { result } = renderHook(() => useQuerySubscriptionsTelemetry(credentials))
    await act(async () => {})

    expect(result.current.isPaused).toBe(false)
    act(() => result.current.setPaused(true))
    expect(result.current.isPaused).toBe(true)

    await act(async () => vi.advanceTimersByTimeAsync(20_000))
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(1)

    act(() => result.current.setPaused(false))
    expect(result.current.isPaused).toBe(false)
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(2)
    await act(async () => {})

    await act(async () => vi.advanceTimersByTimeAsync(20_000))
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(3)
  })

  it('lets an in-flight request finish after pausing without scheduling another', async () => {
    const request = deferred<unknown>()
    jazzMocks.fetchServerSubscriptions.mockReturnValueOnce(request.promise)
    const { result } = renderHook(() => useQuerySubscriptionsTelemetry(credentials))

    act(() => result.current.setPaused(true))
    await act(async () => {
      request.resolve({ appId: 'app-1', generatedAt: 1, queries: [] })
      await request.promise
    })
    await act(async () => vi.advanceTimersByTimeAsync(20_000))

    expect(result.current.state.kind).toBe('ready')
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(1)
  })

  it('refreshes manually while paused without resuming automatic polling', async () => {
    jazzMocks.fetchServerSubscriptions.mockResolvedValue({
      appId: 'app-1',
      generatedAt: 1,
      queries: [],
    })
    const { result } = renderHook(() => useQuerySubscriptionsTelemetry(credentials))
    await act(async () => {})

    act(() => result.current.setPaused(true))
    act(() => result.current.refresh())
    await act(async () => {})
    await act(async () => vi.advanceTimersByTimeAsync(20_000))

    expect(result.current.isPaused).toBe(true)
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(2)
  })

  it('queues one fresh snapshot when resumed during an in-flight request', async () => {
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    jazzMocks.fetchServerSubscriptions
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const { result } = renderHook(() => useQuerySubscriptionsTelemetry(credentials))

    act(() => result.current.setPaused(true))
    act(() => result.current.setPaused(false))
    act(() => result.current.setPaused(false))
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(1)

    await act(async () => {
      first.resolve({ appId: 'app-1', generatedAt: 1, queries: [] })
      await first.promise
    })

    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(2)
    expect(result.current.state.kind).toBe('refreshing')

    await act(async () => {
      second.resolve({ appId: 'app-1', generatedAt: 2, queries: [] })
      await second.promise
    })
  })

  it('retains successful history when a manual refresh fails', async () => {
    jazzMocks.fetchServerSubscriptions
      .mockResolvedValueOnce({ appId: 'app-1', generatedAt: 10, queries: [accountsGroup] })
      .mockRejectedValueOnce(new TypeError('private network detail'))

    const { result } = renderHook(() => useQuerySubscriptionsTelemetry(credentials))
    await act(async () => {})

    act(() => result.current.refresh())
    await act(async () => {})

    expect(result.current.history.map(({ kind }) => kind)).toEqual(['success', 'failure'])
    expect(result.current.history[1]).toMatchObject({
      kind: 'failure',
      attemptedAt: 1_000,
      error: { kind: 'network' },
    })
    expect(result.current.timeline.latestSuccessfulCapture?.groups).toEqual([accountsGroup])
    expect(result.current.state.kind).toBe('stale-history')
  })

  it('recovers from a failed refresh when the successful marker is unchanged', async () => {
    jazzMocks.fetchServerSubscriptions
      .mockResolvedValueOnce({ appId: 'app-1', generatedAt: 10, queries: [accountsGroup] })
      .mockRejectedValueOnce(new TypeError('private network detail'))
      .mockResolvedValueOnce({ appId: 'app-1', generatedAt: 10, queries: [accountsGroup] })

    const { result } = renderHook(() => useQuerySubscriptionsTelemetry(credentials))
    await act(async () => {})

    act(() => result.current.refresh())
    await act(async () => {})
    expect(result.current.state.kind).toBe('stale-history')

    act(() => result.current.refresh())
    await act(async () => {})

    expect(result.current.history.map(({ kind }) => kind)).toEqual(['success', 'failure'])
    expect(result.current.state.kind).toBe('ready')
  })

  it('bounds retained history', async () => {
    jazzMocks.fetchServerSubscriptions.mockImplementation(() =>
      Promise.resolve({
        appId: 'app-1',
        generatedAt: jazzMocks.fetchServerSubscriptions.mock.calls.length,
        queries: [],
      }),
    )

    const { result } = renderHook(() => useQuerySubscriptionsTelemetry(credentials))
    await act(async () => {})

    for (let capture = 1; capture < 61; capture += 1) {
      act(() => result.current.refresh())
      await act(async () => {})
    }

    expect(result.current.history).toHaveLength(60)
    expect(result.current.timeline.latestSuccessfulCapture?.generatedAt).toBe(61)
  })

  it('reduces malformed responses into invalid-response captures', async () => {
    jazzMocks.fetchServerSubscriptions.mockResolvedValue({
      appId: 'another-app',
      generatedAt: 10,
      queries: [],
    })

    const { result } = renderHook(() => useQuerySubscriptionsTelemetry(credentials))
    await act(async () => {})

    expect(result.current.history[0]).toMatchObject({
      kind: 'failure',
      error: { kind: 'invalid-response' },
    })
    expect(result.current.state.kind).toBe('failed-initial-load')
  })

  it('classifies malformed JSON transport failures as invalid responses', async () => {
    jazzMocks.fetchServerSubscriptions.mockRejectedValue(new SyntaxError('private response body'))

    const { result } = renderHook(() => useQuerySubscriptionsTelemetry(credentials))
    await act(async () => {})

    expect(result.current.history[0]).toMatchObject({
      kind: 'failure',
      error: { kind: 'invalid-response' },
    })
  })

  it('clears scheduled work and ignores active completion after unmount', async () => {
    jazzMocks.fetchServerSubscriptions.mockResolvedValueOnce({
      appId: 'app-1',
      generatedAt: 1,
      queries: [],
    })
    const settled = renderHook(() => useQuerySubscriptionsTelemetry(credentials))
    await act(async () => {})
    settled.unmount()

    await act(async () => vi.advanceTimersByTimeAsync(20_000))
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(1)

    const active = deferred<unknown>()
    jazzMocks.fetchServerSubscriptions.mockReturnValueOnce(active.promise)
    const pending = renderHook(() => useQuerySubscriptionsTelemetry(credentials))
    pending.unmount()

    await act(async () => {
      active.resolve({ appId: 'app-1', generatedAt: 2, queries: [] })
      await active.promise
    })
    await act(async () => vi.advanceTimersByTimeAsync(20_000))
    expect(jazzMocks.fetchServerSubscriptions).toHaveBeenCalledTimes(2)
  })
})
