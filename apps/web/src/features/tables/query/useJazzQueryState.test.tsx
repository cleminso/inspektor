import { act, renderHook } from '@testing-library/react'
import type { DynamicTableRow, QueryBuilder } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useJazzQueryState } from '@tables/query/useJazzQueryState'

const { entry, listeners, manager } = vi.hoisted(() => {
  const listeners = new Set<{
    onDelta?: () => void
    onError?: () => void
    onfulfilled?: () => void
  }>()
  const entry = {
    state: {
      status: 'pending' as 'pending' | 'fulfilled' | 'rejected',
      data: undefined as DynamicTableRow[] | undefined,
      error: null as unknown,
    },
    subscribe: vi.fn((listener: typeof listeners extends Set<infer T> ? T : never) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }),
  }
  const manager = {
    makeQueryKey: vi.fn(() => 'query-key'),
    getCacheEntry: vi.fn(() => entry),
  }

  return { entry, listeners, manager }
})

const query = {
  _build: () => 'users-query',
  _rowType: undefined as unknown as DynamicTableRow,
  _schema: {},
  _table: 'users',
} satisfies QueryBuilder<DynamicTableRow>
const queryManager = manager as unknown as JazzClient['manager']

beforeEach(() => {
  listeners.clear()
  entry.state = {
    status: 'pending',
    data: undefined,
    error: null,
  }
  entry.subscribe.mockClear()
  manager.getCacheEntry.mockClear()
  manager.makeQueryKey.mockClear()
})

describe('useJazzQueryState', () => {
  it('exposes fulfilled rows from the shared Jazz cache entry', () => {
    const { result } = renderHook(() =>
      useJazzQueryState(queryManager, query, { propagation: 'full' }),
    )

    expect(result.current.status).toBe('pending')

    act(() => {
      entry.state = {
        status: 'fulfilled',
        data: [{ id: 'user-1', name: 'Ada' } as DynamicTableRow],
        error: null,
      }
      for (const listener of listeners) {
        listener.onfulfilled?.()
      }
    })

    expect(result.current).toMatchObject({
      status: 'fulfilled',
      data: [{ id: 'user-1', name: 'Ada' }],
      error: null,
    })
  })

  it('exposes rejected query state instead of leaving the consumer loading', () => {
    const { result } = renderHook(() => useJazzQueryState(queryManager, query))
    const error = new Error('Query unavailable')

    act(() => {
      entry.state = {
        status: 'rejected',
        data: undefined,
        error,
      }
      for (const listener of listeners) {
        listener.onError?.()
      }
    })

    expect(result.current).toEqual({
      status: 'rejected',
      data: undefined,
      error,
    })
  })

  it('stays idle without a runtime query manager', () => {
    const { result } = renderHook(() => useJazzQueryState(null, query))

    expect(result.current).toEqual({
      status: 'idle',
      data: undefined,
      error: null,
    })
    expect(manager.makeQueryKey).not.toHaveBeenCalled()
  })
})
