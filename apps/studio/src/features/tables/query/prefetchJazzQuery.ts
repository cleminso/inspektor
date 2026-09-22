import type { QueryBuilder, QueryOptions } from 'jazz-tools'
import { getSubscriptionStore, type JazzClient } from 'jazz-tools/client'

/** Keeps one canonical Jazz query entry active so a rendered consumer can reuse its work. */
export function prefetchJazzQuery<T extends { id: string }>(
  client: JazzClient,
  query: QueryBuilder<T>,
  options?: QueryOptions,
) {
  const store = getSubscriptionStore(client)
  const key = store.makeQueryKey(query, options)
  const entry = store.getCacheEntry<T>(key)
  const unsubscribe = entry.subscribe({})
  let released = false

  return {
    promise: entry.promise,
    release: () => {
      if (released === true) return
      released = true
      unsubscribe()
    },
  }
}
