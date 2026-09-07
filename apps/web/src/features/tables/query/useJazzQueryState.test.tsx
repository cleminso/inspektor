import { act, renderHook } from '@testing-library/react'
import type { DynamicTableRow, QueryBuilder, SubscriptionDelta } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useJazzQueryState } from '@tables/query/useJazzQueryState'

const { entry, listeners, manager } = vi.hoisted(() => {
  const listeners = new Set<{
    onDelta?: (delta: SubscriptionDelta<DynamicTableRow>) => void
    onError?: () => void
    onfulfilled?: () => void
    onReset?: () => void
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
    computeKey: vi.fn(() => 'query-key'),
    makeQueryKey: vi.fn(() => 'query-key'),
    getCacheEntry: vi.fn(() => entry),
    peekState: vi.fn(() => entry.state),
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
  manager.computeKey.mockClear()
  manager.makeQueryKey.mockClear()
  manager.peekState.mockClear()
})

describe('useJazzQueryState', () => {
  it('does not register or create a cache entry during a render without a subscription commit', () => {
    function QueryConsumer() {
      useJazzQueryState(queryManager, query)
      return null
    }

    renderToString(<QueryConsumer />)

    expect(manager.computeKey).toHaveBeenCalledWith(query, undefined)
    expect(manager.peekState).toHaveBeenCalledWith('query-key')
    expect(manager.makeQueryKey).not.toHaveBeenCalled()
    expect(manager.getCacheEntry).not.toHaveBeenCalled()
  })

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

  it('accepts an onDelta update after the query is fulfilled', () => {
    const onDelta = vi.fn()
    entry.state = {
      status: 'fulfilled',
      data: [{ id: 'user-1', name: 'Ada' } as DynamicTableRow],
      error: null,
    }
    const { result } = renderHook(() => useJazzQueryState(queryManager, query, undefined, onDelta))
    const delta: SubscriptionDelta<DynamicTableRow> = { all: [], delta: [] }

    act(() => {
      entry.state = {
        status: 'fulfilled',
        data: [{ id: 'user-1', name: 'Grace' } as DynamicTableRow],
        error: null,
      }
      for (const listener of listeners) {
        listener.onDelta?.(delta)
      }
    })

    expect(onDelta).toHaveBeenCalledWith(delta)
    expect(result.current).toMatchObject({
      status: 'fulfilled',
      data: [{ id: 'user-1', name: 'Grace' }],
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

  it('returns to pending when Jazz resets an active query', () => {
    const { result } = renderHook(() => useJazzQueryState(queryManager, query))

    act(() => {
      entry.state = {
        status: 'fulfilled',
        data: [{ id: 'user-1' } as DynamicTableRow],
        error: null,
      }
      for (const listener of listeners) listener.onfulfilled?.()
    })

    act(() => {
      entry.state = { status: 'pending', data: undefined, error: null }
      for (const listener of listeners) listener.onReset?.()
    })

    expect(result.current.status).toBe('pending')
  })

  it('does not resubscribe when an equivalent query builder replaces the previous object', () => {
    const { rerender } = renderHook(
      ({ currentQuery }) => useJazzQueryState(queryManager, currentQuery),
      { initialProps: { currentQuery: query } },
    )
    const equivalentQuery = { ...query }

    rerender({ currentQuery: equivalentQuery })

    expect(entry.subscribe).toHaveBeenCalledOnce()
    expect(manager.computeKey).toHaveBeenLastCalledWith(equivalentQuery, undefined)
  })

  it('observes the latest onDelta callback without resubscribing', () => {
    const firstOnDelta = vi.fn()
    const latestOnDelta = vi.fn()
    const { rerender } = renderHook(
      ({ onDelta }) => useJazzQueryState(queryManager, query, undefined, onDelta),
      { initialProps: { onDelta: firstOnDelta } },
    )
    const delta: SubscriptionDelta<DynamicTableRow> = { all: [], delta: [] }

    rerender({ onDelta: latestOnDelta })
    act(() => {
      for (const listener of listeners) listener.onDelta?.(delta)
    })

    expect(entry.subscribe).toHaveBeenCalledOnce()
    expect(firstOnDelta).not.toHaveBeenCalled()
    expect(latestOnDelta).toHaveBeenCalledWith(delta)
  })

  it('unsubscribes from a replaced manager and reads the replacement snapshot', () => {
    const replacementState = {
      status: 'fulfilled' as const,
      data: [{ id: 'replacement-row' } as DynamicTableRow],
      error: null,
    }
    const replacementEntry = {
      state: replacementState,
      subscribe: vi.fn(() => () => undefined),
    }
    const replacementManager = {
      computeKey: vi.fn(() => 'query-key'),
      makeQueryKey: vi.fn(() => 'query-key'),
      getCacheEntry: vi.fn(() => replacementEntry),
      peekState: vi.fn(() => replacementState),
    } as unknown as JazzClient['manager']
    const { result, rerender } = renderHook(
      ({ currentManager }) => useJazzQueryState(currentManager, query),
      { initialProps: { currentManager: queryManager } },
    )

    rerender({ currentManager: replacementManager })

    expect(listeners).toHaveLength(0)
    expect(replacementEntry.subscribe).toHaveBeenCalledOnce()
    expect(result.current).toBe(replacementState)
  })
})
