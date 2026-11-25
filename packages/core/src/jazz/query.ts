import { Cause, Effect, Queue, Schema, Stream } from 'effect'
import type { QueryBuilder, QueryOptions } from 'jazz-tools'
import {
  getSubscriptionStore,
  type CacheEntryHandle,
  type JazzClient,
  type UseAllState,
} from 'jazz-tools/client'

export class QueryFailure extends Schema.TaggedError<QueryFailure>()('QueryFailure', {
  cause: Schema.Unknown,
}) {}

export const inspectorQueryOptions = { tier: 'remote' } as const satisfies QueryOptions

/** This SDK terminal transport failure requires the host to replace its runtime. */
export function isRecoverableJazzTransportError(error: unknown): boolean {
  return error instanceof Error && error.message === 'message credit exceeds outstanding balance'
}

export type QueryCallbacks<T extends { id: string }> = Parameters<
  CacheEntryHandle<T>['subscribe']
>[0]

/**
 * Jazz owns key identity, snapshots, source subscriptions, and retention.
 * Creating this descriptor is read-only. Each acquisition owns only its listener.
 * @lat: [[tableQueries#Preparation and lifetime]]
 */
export function canonicalQuery<T extends { id: string }>(
  client: JazzClient,
  query: QueryBuilder<T>,
  options: QueryOptions = inspectorQueryOptions,
) {
  const store = getSubscriptionStore(client)
  const key = store.computeKey(query, options)
  const getSnapshot = (): UseAllState<T> => store.peekState<T>(key)
  const acquire = (callbacks: QueryCallbacks<T> = {}) =>
    Effect.acquireRelease(
      Effect.try({
        try: () => {
          const registeredKey = store.makeQueryKey(query, options)
          const entry = store.getCacheEntry<T>(registeredKey)
          // Jazz can call a settled listener before subscribe returns its release.
          // Capture that callback failure so acquisition cannot leak the listener.
          let acquiring = true
          let callbackFailure: { cause: unknown } | undefined
          const notify = (callback: () => void) => {
            try {
              callback()
            } catch (cause) {
              if (acquiring === false) throw cause
              callbackFailure = { cause }
            }
          }
          const unsubscribe = entry.subscribe({
            onfulfilled: (data) => notify(() => callbacks.onfulfilled?.(data)),
            onDelta: (delta) => notify(() => callbacks.onDelta?.(delta)),
            onError: (error) => notify(() => callbacks.onError?.(error)),
            onReset: () => notify(() => callbacks.onReset?.()),
          })
          acquiring = false
          if (callbackFailure !== undefined) {
            unsubscribe()
            throw callbackFailure.cause
          }
          return { entry, unsubscribe }
        },
        catch: (cause) => new QueryFailure({ cause }),
      }),
      ({ unsubscribe }) => Effect.sync(unsubscribe),
    ).pipe(Effect.map(({ entry }) => entry))

  const observe = Stream.callback<UseAllState<T>, QueryFailure>(
    Effect.fnUntraced(function* (queue) {
      let previous: UseAllState<T> | undefined
      const publish = () => {
        const state = getSnapshot()
        if (state === previous) return
        previous = state
        if (state.status === 'rejected') {
          Queue.failCauseUnsafe(queue, Cause.fail(new QueryFailure({ cause: state.error })))
        } else {
          Queue.offerUnsafe(queue, state)
        }
      }
      yield* acquire({
        onfulfilled: publish,
        onDelta: publish,
        onError: publish,
        onReset: publish,
      })
      // subscribe can settle synchronously or return an already settled entry.
      publish()
    }),
    // These are full snapshots, not an audit log. Slow observers need only the latest state.
    { bufferSize: 1, strategy: 'sliding' },
  )

  // Observe the current generation, not a captured promise that a reset can retire.
  const prepare = observe.pipe(
    Stream.filter((state) => state.status === 'fulfilled'),
    Stream.map((state) => state.data),
    Stream.take(1),
    Stream.runFold(
      (): T[] => [],
      (_previous, rows) => rows,
    ),
  )

  return { key, getSnapshot, acquire, observe, prepare }
}
