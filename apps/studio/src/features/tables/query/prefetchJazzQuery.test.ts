import type { QueryBuilder } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import { describe, expect, it, vi } from 'vitest'

import { prefetchJazzQuery } from '@tables/query/prefetchJazzQuery'
import type { DynamicTableRow } from '@tables/tableTypes'

const { clientStores, entry, store, unsubscribe } = vi.hoisted(() => {
  const unsubscribe = vi.fn()
  const entry = {
    promise: Promise.resolve([]),
    subscribe: vi.fn(() => unsubscribe),
  }
  const store = {
    makeQueryKey: vi.fn(() => 'query-key'),
    getCacheEntry: vi.fn(() => entry),
  }

  return {
    clientStores: new WeakMap<object, object>(),
    entry,
    store,
    unsubscribe,
  }
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
const client = {} as JazzClient
clientStores.set(client, store)

describe('prefetchJazzQuery', () => {
  it('owns the canonical Jazz cache entry until released', async () => {
    const preparation = prefetchJazzQuery(client, query, { tier: 'remote' })

    expect(store.makeQueryKey).toHaveBeenCalledWith(query, { tier: 'remote' })
    expect(store.getCacheEntry).toHaveBeenCalledWith('query-key')
    expect(entry.subscribe).toHaveBeenCalledOnce()
    expect(entry.subscribe).toHaveBeenCalledWith({})
    expect(preparation.promise).toBe(entry.promise)

    await expect(preparation.promise).resolves.toEqual([])
    preparation.release()
    preparation.release()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
