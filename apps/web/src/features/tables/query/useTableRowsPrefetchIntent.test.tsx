import { act, cleanup, renderHook } from '@testing-library/react'
import type { WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTableRowsPrefetchIntent } from './useTableRowsPrefetchIntent'

const { releasePrefetch, startTableRowsPrefetch } = vi.hoisted(() => ({
  releasePrefetch: vi.fn(),
  startTableRowsPrefetch: vi.fn(),
}))

vi.mock('@tables/query/tableRowsPrefetch', () => ({
  TABLE_ROWS_PREFETCH_INTENT_DELAY_MS: 75,
  startTableRowsPrefetch,
}))

const client = { manager: {} } as unknown as Pick<JazzClient, 'manager'>
const schema: WasmSchema = { users: { columns: [] } }

function renderPrefetchIntent(availableKeys: readonly string[]) {
  return renderHook(
    ({ availableKeys: nextAvailableKeys }: { availableKeys: readonly string[] }) =>
      useTableRowsPrefetchIntent({
        activeKey: null,
        availableKeys: nextAvailableKeys,
        client,
        schema,
      }),
    { initialProps: { availableKeys } },
  )
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

beforeEach(() => {
  releasePrefetch.mockClear()
  startTableRowsPrefetch.mockReset()
  startTableRowsPrefetch.mockReturnValue(releasePrefetch)
})

describe('useTableRowsPrefetchIntent', () => {
  it('cancels scheduled work when its target becomes unavailable', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderPrefetchIntent(['users'])

    act(() => result.current.schedule({ key: 'users', tableName: 'users' }))
    rerender({ availableKeys: [] })
    act(() => vi.runAllTimers())

    expect(startTableRowsPrefetch).not.toHaveBeenCalled()
  })

  it('replaces work when one UI target resolves to a different query', () => {
    const firstRelease = vi.fn()
    const secondRelease = vi.fn()
    startTableRowsPrefetch.mockReturnValueOnce(firstRelease).mockReturnValueOnce(secondRelease)
    const { result } = renderPrefetchIntent(['users'])

    act(() => result.current.prefetch({ key: 'users', page: 1, tableName: 'users' }))
    act(() => result.current.prefetch({ key: 'users', page: 2, tableName: 'users' }))

    expect(startTableRowsPrefetch).toHaveBeenCalledTimes(2)
    expect(firstRelease).toHaveBeenCalledOnce()
    expect(secondRelease).not.toHaveBeenCalled()
  })

  it('cancels older scheduled work when intent returns to the active prefetch target', () => {
    vi.useFakeTimers()
    const { result } = renderPrefetchIntent(['users', 'posts'])

    act(() => result.current.prefetch({ key: 'users', tableName: 'users' }))
    act(() => result.current.schedule({ key: 'posts', tableName: 'posts' }))
    act(() => result.current.schedule({ key: 'users', tableName: 'users' }))
    act(() => vi.runAllTimers())

    expect(startTableRowsPrefetch).toHaveBeenCalledOnce()
  })

  it.each(['prefetch', 'schedule'] as const)(
    'transfers same-query ownership through %s intent',
    (startIntent) => {
      const { result } = renderPrefetchIntent(['tab-a', 'tab-b'])

      act(() => result.current.prefetch({ key: 'tab-a', tableName: 'users' }))
      act(() => result.current[startIntent]({ key: 'tab-b', tableName: 'users' }))
      act(() => result.current.release('tab-b'))

      expect(startTableRowsPrefetch).toHaveBeenCalledOnce()
      expect(releasePrefetch).toHaveBeenCalledOnce()
    },
  )

  it('releases active work when its owner unmounts', () => {
    const { result, unmount } = renderPrefetchIntent(['users'])

    act(() => result.current.prefetch({ key: 'users', tableName: 'users' }))
    unmount()

    expect(releasePrefetch).toHaveBeenCalledOnce()
  })

  it('releases active work when the runtime identity changes', () => {
    const nextClient = { manager: {} } as unknown as Pick<JazzClient, 'manager'>
    const nextSchema: WasmSchema = { users: { columns: [] } }
    const { result, rerender } = renderHook(
      ({ runtimeClient, runtimeSchema }) =>
        useTableRowsPrefetchIntent({
          activeKey: null,
          availableKeys: ['users'],
          client: runtimeClient,
          schema: runtimeSchema,
        }),
      { initialProps: { runtimeClient: client, runtimeSchema: schema } },
    )

    act(() => result.current.prefetch({ key: 'users', tableName: 'users' }))
    rerender({ runtimeClient: nextClient, runtimeSchema: schema })
    act(() => result.current.prefetch({ key: 'users', tableName: 'users' }))
    rerender({ runtimeClient: nextClient, runtimeSchema: nextSchema })

    expect(releasePrefetch).toHaveBeenCalledTimes(2)
  })
})
