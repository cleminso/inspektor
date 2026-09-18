import { act, renderHook } from '@testing-library/react'
import type { QueryBuilder } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import type { SubscriptionDelta } from 'jazz-tools/shared'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useJazzQueryState } from '@tables/query/useJazzQueryState'
import type { DynamicTableRow } from '@tables/tableTypes'

const { clientStores, entry, listeners, store } = vi.hoisted(() => {
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
  const store = {
    computeKey: vi.fn(() => 'query-key'),
    makeQueryKey: vi.fn(() => 'query-key'),
    getCacheEntry: vi.fn(() => entry),
    peekState: vi.fn(() => entry.state),
  }

  return { clientStores: new WeakMap<object, object>(), entry, listeners, store }
})

vi.mock('jazz-tools/client', () => ({
  getSubscriptionStore: (client: object) => clientStores.get(client),
}))

const query = {
  _build: () => 'users-query',
  _rowType: undefined as unknown as DynamicTableRow,
  _schema: {},
  _table: 'users',
} satisfies QueryBuilder<DynamicTableRow>
const queryClient = {} as JazzClient
clientStores.set(queryClient, store)

beforeEach(() => {
  listeners.clear()
  entry.state = {
    status: 'pending',
    data: undefined,
    error: null,
  }
  entry.subscribe.mockClear()
  store.getCacheEntry.mockClear()
  store.computeKey.mockClear()
  store.makeQueryKey.mockClear()
  store.peekState.mockClear()
})

describe('useJazzQueryState', () => {
  it('does not register or create a cache entry during a render without a subscription commit', () => {
    function QueryConsumer() {
      useJazzQueryState(queryClient, query)
      return null
    }

    renderToString(<QueryConsumer />)

    expect(store.computeKey).toHaveBeenCalledWith(query, undefined)
    expect(store.peekState).toHaveBeenCalledWith('query-key')
    expect(store.makeQueryKey).not.toHaveBeenCalled()
    expect(store.getCacheEntry).not.toHaveBeenCalled()
  })

  it('exposes fulfilled rows from the shared Jazz cache entry', () => {
    const { result } = renderHook(() =>
      useJazzQueryState(queryClient, query, { tier: 'remote' }),
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
    const { result } = renderHook(() => useJazzQueryState(queryClient, query, undefined, onDelta))
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
    const { result } = renderHook(() => useJazzQueryState(queryClient, query))
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

  it('stays idle without a runtime client', () => {
    const { result } = renderHook(() => useJazzQueryState(null, query))

    expect(result.current).toEqual({
      status: 'idle',
      data: undefined,
      error: null,
    })
    expect(store.makeQueryKey).not.toHaveBeenCalled()
  })

  it('returns to pending when Jazz resets an active query', () => {
    const { result } = renderHook(() => useJazzQueryState(queryClient, query))

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
      ({ currentQuery }) => useJazzQueryState(queryClient, currentQuery),
      { initialProps: { currentQuery: query } },
    )
    const equivalentQuery = { ...query }

    rerender({ currentQuery: equivalentQuery })

    expect(entry.subscribe).toHaveBeenCalledOnce()
    expect(store.computeKey).toHaveBeenLastCalledWith(equivalentQuery, undefined)
  })

  it('observes the latest onDelta callback without resubscribing', () => {
    const firstOnDelta = vi.fn()
    const latestOnDelta = vi.fn()
    const { rerender } = renderHook(
      ({ onDelta }) => useJazzQueryState(queryClient, query, undefined, onDelta),
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

  it('unsubscribes from a replaced client and reads the replacement snapshot', () => {
    const replacementState = {
      status: 'fulfilled' as const,
      data: [{ id: 'replacement-row' } as DynamicTableRow],
      error: null,
    }
    const replacementEntry = {
      state: replacementState,
      subscribe: vi.fn(() => () => undefined),
    }
    const replacementStore = {
      computeKey: vi.fn(() => 'query-key'),
      makeQueryKey: vi.fn(() => 'query-key'),
      getCacheEntry: vi.fn(() => replacementEntry),
      peekState: vi.fn(() => replacementState),
    }
    const replacementClient = {} as JazzClient
    clientStores.set(replacementClient, replacementStore)
    const { result, rerender } = renderHook(
      ({ currentClient }) => useJazzQueryState(currentClient, query),
      { initialProps: { currentClient: queryClient } },
    )

    rerender({ currentClient: replacementClient })

    expect(listeners).toHaveLength(0)
    expect(replacementEntry.subscribe).toHaveBeenCalledOnce()
    expect(result.current).toBe(replacementState)
  })
})
