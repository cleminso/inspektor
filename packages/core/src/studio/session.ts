import { Effect, Fiber, Schema, Stream, SubscriptionRef, type Scope } from 'effect'
import type { PublishedBundle, WasmSchema } from 'jazz-tools'

export class SessionError extends Schema.TaggedError<SessionError>()('SessionError', {
  source: Schema.Literals(['client', 'schema']),
  cause: Schema.Unknown,
}) {}

export type MetadataState<A> =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly value: A }
  | { readonly status: 'failed'; readonly cause: unknown }

interface SessionMetadata {
  readonly schema: MetadataState<WasmSchema>
  readonly permissions: MetadataState<PublishedBundle | null>
}

export type SessionState<Client> = SessionMetadata &
  (
    | { readonly status: 'opening' }
    | {
        readonly status: 'active'
        readonly client: Client
        readonly schema: { readonly status: 'ready'; readonly value: WasmSchema }
      }
    | { readonly status: 'failed'; readonly error: SessionError }
    | { readonly status: 'closed' }
  )

export interface SessionAccess<Client> {
  readonly acquireClient: Effect.Effect<Client, unknown, Scope.Scope>
  readonly loadSchema: Effect.Effect<WasmSchema, unknown>
  readonly loadPermissions: Effect.Effect<PublishedBundle | null, unknown>
}

export interface Session<Client> {
  readonly snapshot: Effect.Effect<SessionState<Client>>
  readonly changes: Stream.Stream<SessionState<Client>>
  readonly failClient: (cause: unknown) => Effect.Effect<void>
}

/**
 * Own one runtime attempt. The scoped access port owns the client; the session
 * publishes it only after schema verification. Clients are opaque identities here.
 */
// @lat: [[runtimeConnectionStartup#Runtime ownership]]
export const openSession = <Client>(
  access: SessionAccess<Client>,
): Effect.Effect<Session<Client>, never, Scope.Scope> =>
  Effect.gen(function* () {
    const state = yield* SubscriptionRef.make<SessionState<Client>>({
      status: 'opening',
      schema: { status: 'loading' },
      permissions: { status: 'loading' },
    })
    const fail = (error: SessionError) =>
      SubscriptionRef.update(state, (current): SessionState<Client> =>
        current.status === 'opening' || current.status === 'active'
          ? {
              status: 'failed',
              schema:
                error.source === 'schema'
                  ? { status: 'failed', cause: error.cause }
                  : current.schema,
              permissions: current.permissions,
              error,
            }
          : current,
      )
    const startup = Effect.scoped(
      Effect.gen(function* () {
        const [schema, client] = yield* Effect.all(
          [
            access.loadSchema.pipe(
              Effect.mapError((cause) => new SessionError({ source: 'schema', cause })),
              Effect.tap((schema) =>
                SubscriptionRef.update(state, (current): SessionState<Client> =>
                  current.status === 'opening'
                    ? { ...current, schema: { status: 'ready', value: schema } }
                    : current,
                ),
              ),
            ),
            access.acquireClient.pipe(
              Effect.mapError((cause) => new SessionError({ source: 'client', cause })),
            ),
          ],
          { concurrency: 'unbounded' },
        )
        yield* SubscriptionRef.update(state, (current): SessionState<Client> =>
          current.status === 'opening'
            ? {
                status: 'active',
                client,
                schema: { status: 'ready', value: schema },
                permissions: current.permissions,
              }
            : current,
        )
        yield* Effect.never
      }),
    ).pipe(
      Effect.matchEffect({
        onFailure: fail,
        onSuccess: () => Effect.void,
      }),
    )
    const startupFiber = yield* Effect.forkScoped(startup)
    yield* Effect.forkScoped(
      access.loadPermissions.pipe(
        Effect.matchEffect({
          onFailure: (cause) =>
            SubscriptionRef.update(state, (current): SessionState<Client> =>
              current.status === 'closed'
                ? current
                : { ...current, permissions: { status: 'failed', cause } },
            ),
          onSuccess: (value) =>
            SubscriptionRef.update(state, (current): SessionState<Client> =>
              current.status === 'closed'
                ? current
                : { ...current, permissions: { status: 'ready', value } },
            ),
        }),
      ),
    )
    yield* Effect.addFinalizer(() =>
      SubscriptionRef.update(state, (current): SessionState<Client> => ({
        status: 'closed',
        schema: current.schema,
        permissions: current.permissions,
      })),
    )
    return {
      snapshot: SubscriptionRef.get(state),
      changes: SubscriptionRef.changes(state),
      failClient: (cause: unknown) =>
        Effect.gen(function* () {
          yield* fail(new SessionError({ source: 'client', cause }))
          yield* Fiber.interrupt(startupFiber)
        }),
    }
  })

export type QueryRecovery<Client> =
  | { readonly status: 'idle' }
  | { readonly status: 'recovering'; readonly failedClient: Client }
  | { readonly status: 'exhausted' }

export type QueryObservation<Client> =
  | { readonly status: 'fulfilled'; readonly client: Client }
  | {
      readonly status: 'rejected'
      readonly client: Client
      readonly recoverableTransportFailure: boolean
    }

// @lat: [[tableQueries#Failure and evidence limits]]
export const observeQueryRecovery = <Client>(
  state: QueryRecovery<Client>,
  activeClient: Client | null,
  observation: QueryObservation<Client>,
): { readonly state: QueryRecovery<Client>; readonly replace: boolean } => {
  if (activeClient !== observation.client) return { state, replace: false }
  if (state.status === 'recovering' && state.failedClient === observation.client) {
    return { state, replace: false }
  }
  if (observation.status === 'fulfilled') {
    return { state: { status: 'idle' }, replace: false }
  }
  if (state.status === 'idle' && observation.recoverableTransportFailure === true) {
    return {
      state: { status: 'recovering', failedClient: observation.client },
      replace: true,
    }
  }
  return {
    state: state.status === 'recovering' ? { status: 'exhausted' } : state,
    replace: false,
  }
}
