import { Effect, Fiber, Stream } from 'effect'
import type { JazzClient } from 'jazz-tools/client'
import { acquireAdminClient } from '../jazz/client.ts'
import { fetchLatestPermissions, fetchStoredSchema } from '../jazz/schema.ts'
import type { ConnectionCredentials, RuntimeConnection } from '../studio/connection.ts'
import {
  openSession,
  type Session,
  type SessionAccess,
  type SessionState,
} from '../studio/session.ts'

export {
  buildSchemaCatalogue,
  createRuntimeTargetHandoff,
  discoverConnection,
  discoverSchemaCatalogue,
  discoverSchemaCatalogueWithRetry,
  EmptySchemaCatalogueError,
  planConnectionOpening,
  resolveConnectionEntry,
  type ConnectionCredentials,
  type ResolvedRuntimeTarget,
  type SchemaCatalogueRecord,
  type StoredConnectionsStore,
} from '../studio/connection.ts'

export type ConnectionExecution = Readonly<ConnectionCredentials> &
  Readonly<Pick<RuntimeConnection, 'id' | 'env'>> & {
    readonly branch: string
    readonly schemaHash: string
  }
export type ConnectionSnapshot = SessionState<JazzClient>

const opening: ConnectionSnapshot = {
  status: 'opening',
  schema: { status: 'loading' },
  permissions: { status: 'loading' },
}
const closed: ConnectionSnapshot = {
  status: 'closed',
  schema: { status: 'loading' },
  permissions: { status: 'loading' },
}

function sameExecution(a: ConnectionExecution | null, b: ConnectionExecution | null): boolean {
  return (
    a === b ||
    (a !== null &&
      b !== null &&
      a.id === b.id &&
      a.serverUrl === b.serverUrl &&
      a.appId === b.appId &&
      a.env === b.env &&
      a.adminSecret === b.adminSecret &&
      a.branch === b.branch &&
      a.schemaHash === b.schemaHash)
  )
}

/** Own accepted connection attempts. Browser adapters supply preparation and visibility signals. */
export function createConnectionRuntime(options: {
  readonly prepare: Effect.Effect<void, unknown>
  readonly onResumeRetry?: (() => void) | undefined
  readonly isHidden?: (() => boolean) | undefined
  readonly access?: ((execution: ConnectionExecution) => SessionAccess<JazzClient>) | undefined
  readonly reconnect?: ((client: JazzClient) => Effect.Effect<void, unknown>) | undefined
}) {
  type Attempt = {
    session: Session<JazzClient> | null
    fiber: Fiber.Fiber<void> | null
  }
  const access =
    options.access ??
    ((execution: ConnectionExecution): SessionAccess<JazzClient> => ({
      acquireClient: acquireAdminClient({
        appId: execution.appId,
        serverUrl: execution.serverUrl,
        env: execution.env,
        adminSecret: execution.adminSecret,
      }),
      loadSchema: fetchStoredSchema(execution, execution.schemaHash),
      loadPermissions: fetchLatestPermissions(execution),
    }))
  const reconnect =
    options.reconnect ??
    ((client: JazzClient) =>
      Effect.tryPromise({
        try: () => client.db.reconnect(),
        catch: (cause) => cause,
      }))
  const listeners = new Set<() => void>()
  let execution: ConnectionExecution | null = null
  let attachment: object | null = null
  let attempt: Attempt | null = null
  let snapshot = closed
  let hidden = false
  let retryOnResume = false

  const publish = (state: ConnectionSnapshot) => {
    snapshot = state
    for (const listener of listeners) listener()
  }
  const retire = () => {
    const previous = attempt
    attempt = null
    if (previous !== null && previous.fiber !== null) {
      void Effect.runPromise(Fiber.interrupt(previous.fiber))
    }
  }
  const retryIfNeeded = (current: Attempt) => {
    if (
      attempt !== current ||
      hidden === true ||
      retryOnResume === false ||
      snapshot.status !== 'failed'
    )
      return
    retryOnResume = false
    if (options.onResumeRetry !== undefined) options.onResumeRetry()
    else retry()
  }
  const start = () => {
    retire()
    const accepted = execution
    if (accepted === null) {
      publish(closed)
      return
    }
    hidden = options.isHidden?.() ?? hidden
    retryOnResume = hidden
    const current: Attempt = { session: null, fiber: null }
    attempt = current
    publish(opening)
    if (attempt !== current) return
    // Yield before acquisition so synchronous listeners can retire the assigned fiber.
    current.fiber = Effect.runFork(
      Effect.scoped(
        Effect.gen(function* () {
          yield* Effect.yieldNow
          const ports = access(accepted)
          const session = yield* openSession({
            ...ports,
            acquireClient: options.prepare.pipe(Effect.andThen(ports.acquireClient)),
          })
          if (attempt !== current) return
          current.session = session
          yield* Stream.runForEach(session.changes, (state) =>
            Effect.sync(() => {
              if (attempt !== current) return
              publish(state)
              retryIfNeeded(current)
            }),
          )
        }),
      ),
    )
  }
  const retry = () => {
    if (attachment !== null && execution !== null) start()
  }
  const failAttempt = (current: Attempt, cause: unknown) => {
    if (attempt !== current || current.session === null) return
    void Effect.runPromise(current.session.failClient(cause))
  }
  return {
    getSnapshot: (): ConnectionSnapshot => snapshot,
    // Render can reject the previous workspace before its attachment effect runs.
    getSnapshotFor: (accepted: ConnectionExecution | null): ConnectionSnapshot =>
      sameExecution(execution, accepted) === true ? snapshot : accepted === null ? closed : opening,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    connect: (accepted: ConnectionExecution | null) => {
      const token = {}
      attachment = token
      const changed = sameExecution(execution, accepted) === false
      // Retain only execution fields, not mutable profile or route metadata.
      execution =
        accepted === null
          ? null
          : {
              id: accepted.id,
              serverUrl: accepted.serverUrl,
              appId: accepted.appId,
              env: accepted.env,
              adminSecret: accepted.adminSecret,
              branch: accepted.branch,
              schemaHash: accepted.schemaHash,
            }
      if (changed === true || attempt === null) start()
      return () => {
        if (attachment !== token) return
        attachment = null
        execution = null
        retryOnResume = false
        retire()
        publish(closed)
      }
    },
    retry,
    suspend: () => {
      hidden = true
      retryOnResume = true
    },
    resume: (hiddenDurationMs: number | null) => {
      hidden = false
      const current = attempt
      if (current === null) return
      retryIfNeeded(current)
      if (
        attempt !== current ||
        hiddenDurationMs === null ||
        hiddenDurationMs < 300_000 ||
        snapshot.status !== 'active'
      )
        return
      const client = snapshot.client
      void Effect.runPromise(
        reconnect(client).pipe(
          Effect.catch((cause) =>
            Effect.sync(() => {
              if (
                attempt === current &&
                snapshot.status === 'active' &&
                snapshot.client === client
              ) {
                failAttempt(current, cause)
              }
            }),
          ),
        ),
      )
    },
  }
}

export type ConnectionRuntime = ReturnType<typeof createConnectionRuntime>
