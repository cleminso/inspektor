import { Effect, Exit, Scope } from 'effect'
import type { QueryBuilder, WasmSchema } from 'jazz-tools'
import type { JazzClient, UseAllState } from 'jazz-tools/client'
import { RowChangeKind } from 'jazz-tools/shared'
import {
  canonicalQuery,
  isRecoverableJazzTransportError,
  type QueryCallbacks,
} from '../jazz/query.ts'
import {
  buildTableRowByIdQuery,
  buildTableRowsQueryFromSearch,
  createTableNavigationPreparation,
  projectRowById,
  projectTableResult,
  type DynamicTableRow,
  type PreparationPolicy,
  type PreparationResult,
  type QueryDiagnosis,
  type SettledTablePage,
  type TableQueryIntent,
} from '../studio/query.ts'
import { observeQueryRecovery, type QueryRecovery } from '../studio/session.ts'

export interface ExplorationSnapshot {
  readonly pendingTableName: string | null
  readonly recoveryStatus: QueryRecovery<JazzClient>['status']
}

type QueryPage = {
  readonly rows: readonly DynamicTableRow[]
  readonly hasNextPage: boolean
  readonly error: unknown | null
  readonly isRecoverableTransportFailure: boolean
}
export type ExplorationQuerySnapshot = QueryPage &
  (
    | {
        readonly status: 'idle'
        readonly isInitialLoading: false
        readonly isRefreshing: false
      }
    | {
        readonly status: 'loading'
        readonly isInitialLoading: true
        readonly isRefreshing: false
      }
    | {
        readonly status: 'refreshing'
        readonly isInitialLoading: false
        readonly isRefreshing: true
      }
    | {
        readonly status: 'rows' | 'empty' | 'rejected'
        readonly isInitialLoading: false
        readonly isRefreshing: false
      }
  )
export type ExplorationRowSnapshot =
  | { readonly status: 'idle' | 'pending'; readonly row: null; readonly error: null }
  | { readonly status: 'fulfilled'; readonly row: DynamicTableRow | null; readonly error: null }
  | { readonly status: 'rejected'; readonly row: null; readonly error: unknown }

export type ExplorationRefinement =
  | { readonly type: 'page'; readonly page: number }
  | { readonly type: 'pageSize'; readonly pageSize: TableQueryIntent['pageSize'] }
  | { readonly type: 'filters'; readonly filters: TableQueryIntent['filters'] }
  | {
      readonly type: 'sort'
      readonly sortColumn: string
      readonly sortDirection: TableQueryIntent['sortDirection']
    }

type Descriptor = Pick<
  ReturnType<typeof canonicalQuery<DynamicTableRow>>,
  'key' | 'getSnapshot' | 'prepare'
> & {
  readonly acquire: (
    callbacks?: QueryCallbacks<DynamicTableRow>,
  ) => Effect.Effect<unknown, unknown, Scope.Scope>
}

const emptyRows: readonly DynamicTableRow[] = []
const idle: ExplorationQuerySnapshot = {
  status: 'idle',
  rows: emptyRows,
  hasNextPage: false,
  error: null,
  isRecoverableTransportFailure: false,
  isInitialLoading: false,
  isRefreshing: false,
}

/** The manager owns recovery and foreground work. Jazz remains the only row source. */
export function createExploration<Reason = never>(options?: {
  readonly canonicalQuery?:
    | ((client: JazzClient, query: QueryBuilder<DynamicTableRow>) => Descriptor)
    | undefined
}) {
  const describe = options?.canonicalQuery ?? canonicalQuery<DynamicTableRow>
  type Connection = {
    readonly targetKey: string
    readonly origin: string
    readonly client: JazzClient | null
    readonly schema: WasmSchema | null
    readonly diagnose: () => Effect.Effect<QueryDiagnosis<Reason>, unknown>
    readonly repair: (reason: Reason) => Effect.Effect<void, unknown>
    readonly replaceRuntime: () => void
  }
  let connection: Connection | null = null
  let connectionToken: object | null = null
  let targetKey: string | null = null
  let recovery: QueryRecovery<JazzClient> = { status: 'idle' }
  let snapshot: ExplorationSnapshot = { pendingTableName: null, recoveryStatus: 'idle' }
  const listeners = new Set<() => void>()
  const leases = new Set<() => void>()
  const connectionObservers = new Set<() => void>()
  const publish = (pendingTableName = snapshot.pendingTableName) => {
    if (
      snapshot.pendingTableName === pendingTableName &&
      snapshot.recoveryStatus === recovery.status
    )
      return
    snapshot = { pendingTableName, recoveryStatus: recovery.status }
    for (const listener of listeners) listener()
  }
  const preparation = createTableNavigationPreparation<Reason>(publish)
  const cancelNavigation = () => Effect.runSync(preparation.cancel)
  const detach = () => {
    const retiringLeases = [...leases]
    cancelNavigation()
    for (const stop of retiringLeases) stop()
  }
  const observe = (client: JazzClient, state: UseAllState<DynamicTableRow>) => {
    if (state.status === 'pending') return
    const observedConnection = connection
    const result = observeQueryRecovery(
      recovery,
      observedConnection?.client ?? null,
      state.status === 'fulfilled'
        ? { status: 'fulfilled', client }
        : {
            status: 'rejected',
            client,
            recoverableTransportFailure: isRecoverableJazzTransportError(state.error),
          },
    )
    recovery = result.state
    publish()
    if (
      result.replace === true &&
      connection?.targetKey === observedConnection?.targetKey &&
      connection?.client === observedConnection?.client
    )
      observedConnection?.replaceRuntime()
  }

  // Each activation owns a fresh scope. Cleanup can safely replay without disposing a handle.
  const lease = (descriptor: Descriptor, callbacks: QueryCallbacks<DynamicTableRow>) => {
    const scope = Scope.makeUnsafe()
    let active = true
    const stop = () => {
      if (active === false) return
      active = false
      leases.delete(stop)
      Effect.runSync(Scope.close(scope, Exit.void))
    }
    leases.add(stop)
    try {
      Effect.runSync(
        Scope.provide(
          descriptor.acquire({
            onfulfilled: (data) => {
              if (active === true) callbacks.onfulfilled?.(data)
            },
            onDelta: (delta) => {
              if (active === true) callbacks.onDelta?.(delta)
            },
            onError: (error) => {
              if (active === true) callbacks.onError?.(error)
            },
            onReset: () => {
              if (active === true) callbacks.onReset?.()
            },
          }),
          scope,
        ),
      )
    } catch (error) {
      stop()
      throw error
    }
    return stop
  }

  const navigate = async (request: {
    readonly intent: TableQueryIntent
    readonly policy: PreparationPolicy
    readonly commit: () => Promise<void> | void
  }): Promise<PreparationResult> => {
    const current = connection
    if (current === null || current.client === null || current.schema === null) return 'unavailable'
    const { client, schema } = current
    return Effect.runPromise(
      preparation.prepare({
        policy: request.policy,
        tableName: request.intent.tableName,
        query: buildTableRowsQueryFromSearch({ schema, intent: request.intent }).pipe(
          Effect.flatMap((query) => {
            const descriptor = describe(client, query)
            return descriptor.acquire().pipe(
              Effect.andThen(descriptor.prepare),
              Effect.onExit(() =>
                Effect.sync(() => {
                  if (connection === current) observe(client, descriptor.getSnapshot())
                }),
              ),
            )
          }),
        ),
        diagnose: Effect.suspend(() =>
          connection === current ? current.diagnose() : Effect.never,
        ),
        repair: (reason) => (connection === current ? current.repair(reason) : Effect.void),
        commit: Effect.tryPromise(async () => {
          if (connection === current) await request.commit()
        }),
      }),
    )
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    connect: (next: Connection) => {
      const previousToken = connectionToken
      detach()
      if (connectionToken !== previousToken) return () => {}
      const token = {}
      connectionToken = token
      connection = next
      if (targetKey !== next.targetKey) {
        targetKey = next.targetKey
        recovery = { status: 'idle' }
        publish()
      }
      for (const activate of connectionObservers) {
        if (connectionToken !== token) break
        activate()
      }
      return () => {
        if (connectionToken !== token) return
        connectionToken = null
        connection = null
        detach()
      }
    },
    retry: () => {
      const current = connection
      cancelNavigation()
      if (connection?.targetKey !== current?.targetKey || connection?.client !== current?.client)
        return
      recovery = { status: 'idle' }
      publish()
      if (
        recovery.status === 'idle' &&
        connection?.targetKey === current?.targetKey &&
        connection?.client === current?.client
      )
        current?.replaceRuntime()
    },
    cancelNavigation,
    navigate,
    refine: (request: {
      readonly current: TableQueryIntent
      readonly change: ExplorationRefinement
      readonly commit: (destination: TableQueryIntent) => Promise<void>
    }) => {
      const { type, ...change } = request.change
      const destination: TableQueryIntent = {
        ...request.current,
        page: 1,
        ...change,
      }
      return navigate({
        intent: destination,
        policy: type === 'page' ? 'ignore' : 'replace',
        commit: () => request.commit(destination),
      })
    },
    createView: () => {
      let previous: SettledTablePage | undefined
      let selected: object | null = null
      return {
        query: (input: {
          readonly client: JazzClient | null
          readonly schema: WasmSchema | null
          readonly origin: string
          readonly scopeKey: string
          readonly intent: TableQueryIntent
          readonly onPageOutOfRange?: (() => void) | undefined
          readonly onRowsAdded?: ((ids: readonly string[]) => void) | undefined
          readonly onRowsUpdated?:
            | ((
                updates: readonly { current: DynamicTableRow; previous: DynamicTableRow }[],
              ) => void)
            | undefined
        }) => {
          const { client, schema, intent } = input
          const descriptor =
            client === null || schema === null
              ? null
              : describe(client, Effect.runSync(buildTableRowsQueryFromSearch({ schema, intent })))
          const token = {}
          let lastState: UseAllState<DynamicTableRow> | undefined
          let result = idle
          let stop: (() => void) | null = null
          let activation: object | null = null
          let stopPrefetch: (() => void) | null = null
          let corrected = false
          let prefetched = false
          let startedAt = 0
          let liveRows = new Map<string, DynamicTableRow>()
          const reported = new Set<string>()
          const subscribers = new Set<() => void>()
          const getSnapshot = (): ExplorationQuerySnapshot => {
            if (descriptor === null || client === null || schema === null) return idle
            const state = descriptor.getSnapshot()
            if (lastState === state) return result
            lastState = state
            const projection = projectTableResult({
              identity: {
                runtime: client,
                schema,
                scopeKey: input.scopeKey,
                intent,
                queryKey: descriptor.key,
              },
              state,
              previous,
            })
            const page = 'page' in projection ? projection.page : undefined
            const pageState = {
              rows: page?.rows ?? emptyRows,
              hasNextPage: page?.hasNextPage ?? false,
              error: state.status === 'rejected' ? state.error : null,
              isRecoverableTransportFailure:
                state.status === 'rejected' && isRecoverableJazzTransportError(state.error),
            }
            result =
              projection.status === 'refreshing'
                ? {
                    ...pageState,
                    status: 'refreshing',
                    isInitialLoading: false,
                    isRefreshing: true,
                  }
                : projection.status === 'loading'
                  ? { ...pageState, status: 'loading', isInitialLoading: true, isRefreshing: false }
                  : {
                      ...pageState,
                      status: projection.status,
                      isInitialLoading: false,
                      isRefreshing: false,
                    }
            return result
          }
          const publishQuery = (
            delta?: Parameters<NonNullable<QueryCallbacks<DynamicTableRow>['onDelta']>>[0],
          ) => {
            if (
              selected !== token ||
              subscribers.size === 0 ||
              descriptor === null ||
              client === null ||
              schema === null ||
              connection?.client !== client ||
              connection.schema !== schema ||
              connection.origin !== input.origin
            )
              return
            const state = descriptor.getSnapshot()
            const before = result
            getSnapshot()
            const activeConnection = connectionToken
            observe(client, state)
            if (
              selected !== token ||
              connectionToken !== activeConnection ||
              connection?.client !== client
            )
              return
            if (state.status === 'fulfilled') {
              const projection = projectTableResult({
                identity: {
                  runtime: client,
                  schema,
                  scopeKey: input.scopeKey,
                  intent,
                  queryKey: descriptor.key,
                },
                state,
              })
              if (projection.status === 'rows' || projection.status === 'empty') {
                previous = projection.page
                const rows = projection.page.rows
                const added: string[] = []
                const updated: { current: DynamicTableRow; previous: DynamicTableRow }[] = []
                for (const change of delta?.delta ?? []) {
                  if (change.kind === RowChangeKind.Updated && change.item !== undefined) {
                    const prior = liveRows.get(change.id)
                    if (prior !== undefined) updated.push({ current: change.item, previous: prior })
                  }
                  if (change.kind === RowChangeKind.Added && reported.has(change.id) === false) {
                    reported.add(change.id)
                    const row = change.item
                    if (row.$createdAt instanceof Date && row.$createdAt.getTime() > startedAt)
                      added.push(change.id)
                  }
                }
                liveRows = new Map(rows.map((row) => [row.id, row]))
                if (added.length > 0) input.onRowsAdded?.(added)
                if (selected !== token || connectionToken !== activeConnection) return
                if (updated.length > 0) input.onRowsUpdated?.(updated)
                if (selected !== token || connectionToken !== activeConnection) return
                if (projection.correctPage === true && corrected === false) {
                  corrected = true
                  input.onPageOutOfRange?.()
                }
                if (selected !== token || connectionToken !== activeConnection) return
                if (projection.prepareNextPage === true && prefetched === false) {
                  prefetched = true
                  const next = describe(
                    client,
                    Effect.runSync(
                      buildTableRowsQueryFromSearch({
                        schema,
                        intent: { ...intent, page: intent.page + 1 },
                      }),
                    ),
                  )
                  const completion = { settled: false }
                  const activeActivation = activation
                  const finish = () => {
                    if (activation !== activeActivation || connectionToken !== activeConnection)
                      return
                    if (next.getSnapshot().status === 'pending') return
                    completion.settled = true
                    stopPrefetch?.()
                    stopPrefetch = null
                  }
                  const release = lease(next, {
                    onfulfilled: finish,
                    onError: finish,
                    onDelta: finish,
                    onReset: finish,
                  })
                  if (
                    completion.settled === true ||
                    next.getSnapshot().status !== 'pending' ||
                    activation !== activeActivation ||
                    connectionToken !== activeConnection ||
                    selected !== token ||
                    subscribers.size === 0
                  )
                    release()
                  else stopPrefetch = release
                }
              }
            }
            if (before !== result) {
              for (const listener of subscribers) {
                if (selected !== token || connectionToken !== activeConnection) return
                listener()
              }
            }
          }
          const activate = () => {
            if (
              selected !== token ||
              descriptor === null ||
              connection?.client !== client ||
              connection.schema !== schema ||
              connection.origin !== input.origin
            )
              return
            const slot = {}
            activation = slot
            const activeConnection = connectionToken
            const previousStop = stop
            stop = null
            previousStop?.()
            stopPrefetch?.()
            stopPrefetch = null
            prefetched = false
            startedAt = Date.now()
            const release = lease(descriptor, {
              onfulfilled: () => publishQuery(),
              onDelta: publishQuery,
              onError: () => publishQuery(),
              onReset: () => publishQuery(),
            })
            if (
              activation !== slot ||
              subscribers.size === 0 ||
              connectionToken !== activeConnection
            ) {
              release()
              return
            }
            stop = release
            publishQuery()
          }
          return {
            key: descriptor?.key ?? null,
            getSnapshot,
            subscribe: (listener: () => void) => {
              subscribers.add(listener)
              if (subscribers.size === 1 && descriptor !== null) {
                selected = token
                connectionObservers.add(activate)
                activate()
              }
              return () => {
                subscribers.delete(listener)
                if (subscribers.size !== 0) return
                activation = null
                connectionObservers.delete(activate)
                if (selected === token) selected = null
                stop?.()
                stop = null
                stopPrefetch?.()
                stopPrefetch = null
                prefetched = false
              }
            },
          }
        },
      }
    },
    row: (input: {
      readonly client: JazzClient | null
      readonly schema: WasmSchema | null
      readonly origin: string
      readonly tableName: string
      readonly rowId: string | null
    }) => {
      const { client, schema, rowId } = input
      const descriptor =
        client === null || schema === null || rowId === null
          ? null
          : describe(
              client,
              Effect.runSync(buildTableRowByIdQuery({ schema, tableName: input.tableName, rowId })),
            )
      let lastState: UseAllState<DynamicTableRow> | undefined
      let result: ExplorationRowSnapshot = { status: 'idle', row: null, error: null }
      let stop: (() => void) | null = null
      let activation: object | null = null
      const subscribers = new Set<() => void>()
      const getSnapshot = (): ExplorationRowSnapshot => {
        if (descriptor === null || rowId === null) return result
        const state = descriptor.getSnapshot()
        if (state === lastState) return result
        lastState = state
        const projection = projectRowById(state, rowId)
        result =
          projection.status === 'fulfilled'
            ? { ...projection, error: null }
            : projection.status === 'rejected'
              ? { ...projection, row: null }
              : { status: 'pending', row: null, error: null }
        return result
      }
      const publishRow = () => {
        if (
          subscribers.size === 0 ||
          descriptor === null ||
          client === null ||
          connection?.client !== client ||
          connection.schema !== schema ||
          connection.origin !== input.origin
        )
          return
        const before = result
        getSnapshot()
        const activeConnection = connectionToken
        observe(client, descriptor.getSnapshot())
        if (connectionToken !== activeConnection || connection?.client !== client) return
        if (before !== result) {
          for (const listener of subscribers) {
            if (connectionToken !== activeConnection) return
            listener()
          }
        }
      }
      const activate = () => {
        if (
          descriptor === null ||
          connection?.client !== client ||
          connection.schema !== schema ||
          connection.origin !== input.origin
        )
          return
        const slot = {}
        activation = slot
        const activeConnection = connectionToken
        const previousStop = stop
        stop = null
        previousStop?.()
        const release = lease(descriptor, {
          onfulfilled: publishRow,
          onDelta: publishRow,
          onError: publishRow,
          onReset: publishRow,
        })
        if (activation !== slot || subscribers.size === 0 || connectionToken !== activeConnection) {
          release()
          return
        }
        stop = release
        publishRow()
      }
      return {
        key: descriptor?.key ?? null,
        getSnapshot,
        subscribe: (listener: () => void) => {
          subscribers.add(listener)
          if (subscribers.size === 1 && descriptor !== null) {
            connectionObservers.add(activate)
            activate()
          }
          return () => {
            subscribers.delete(listener)
            if (subscribers.size === 0) {
              activation = null
              connectionObservers.delete(activate)
              stop?.()
              stop = null
            }
          }
        },
      }
    },
  }
}

export type Exploration<Reason = never> = ReturnType<typeof createExploration<Reason>>
