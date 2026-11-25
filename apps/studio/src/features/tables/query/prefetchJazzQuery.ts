import { Effect, Exit, Scope } from 'effect'
import type { QueryBuilder, QueryOptions } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/client'
import { canonicalQuery } from '@inspektor/core/jazz/query'

/** Retain the canonical entry across preparation-to-render handoff. No application row cache. */
export function prefetchJazzQuery<T extends { id: string }>(
  client: JazzClient,
  query: QueryBuilder<T>,
  options?: QueryOptions,
) {
  const descriptor = canonicalQuery(client, query, options)
  const scope = Scope.makeUnsafe()
  const controller = new AbortController()
  let released = false
  const release = () => {
    if (released === true) return
    released = true
    controller.abort()
    Effect.runSync(Scope.close(scope, Exit.void))
  }
  try {
    Effect.runSync(Scope.provide(descriptor.acquire(), scope))
  } catch (error) {
    release()
    throw error
  }
  const promise = Effect.runPromise(descriptor.prepare, { signal: controller.signal })
  // Warm-up callers need no result. Navigation callers still receive the original rejection.
  void promise.catch(() => undefined)
  return { promise, release }
}
