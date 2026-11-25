import assert from 'node:assert/strict'
import { Deferred, Effect } from 'effect'
import type { JazzClient, UseAllState } from 'jazz-tools/client'
import type { WasmSchema } from 'jazz-tools'
import type { QueryCallbacks } from '../src/jazz/query.ts'
import type { DynamicTableRow } from '../src/studio/query.ts'
import { createExploration } from '../src/workbench/exploration.ts'

const manager = createExploration()
let replaced = 0
const connection = {
  targetKey: 'one',
  origin: 'test',
  client: null,
  schema: null,
  diagnose: () => Effect.succeed({ status: 'reachable' as const }),
  repair: () => Effect.void,
  replaceRuntime: () => {
    replaced += 1
  },
}
const oldRelease = manager.connect(connection)
const release = manager.connect(connection)
oldRelease()
manager.retry()
assert.equal(replaced, 1)
release()
const replay = manager.connect(connection)
assert.equal(manager.getSnapshot().recoveryStatus, 'idle')
replay()
assert.equal(
  await manager.navigate({
    intent: {
      tableName: 'items',
      filters: [],
      sortColumn: 'id',
      sortDirection: 'asc',
      page: 1,
      pageSize: 100,
    },
    policy: 'replace',
    commit: () => {
      throw new Error('Must not commit')
    },
  }),
  'unavailable',
)

const schema: WasmSchema = { items: { columns: [] } }
const intent = {
  tableName: 'items',
  filters: [],
  sortColumn: 'id',
  sortDirection: 'asc',
  page: 1,
  pageSize: 100,
} as const
// Clients are opaque identity tokens. Only the injected canonical port uses them.
const client = {} as JazzClient
const replacement = {} as JazzClient
const pending: UseAllState<DynamicTableRow> = {
  status: 'pending',
  data: undefined,
  error: null,
  promise: Object.assign(new Promise<never>(() => {}), { status: 'pending' as const }),
}
function source(key = 'native-key') {
  let state = pending
  let acquired = 0
  const ready = Deferred.makeUnsafe<DynamicTableRow[]>()
  const listeners = new Set<QueryCallbacks<DynamicTableRow>>()
  return {
    get acquired() {
      return acquired
    },
    get callbacks() {
      return [...listeners]
    },
    descriptor: {
      key,
      getSnapshot: () => state,
      prepare: Deferred.await(ready),
      acquire: (callbacks: QueryCallbacks<DynamicTableRow> = {}) =>
        Effect.acquireRelease(
          Effect.sync(() => {
            acquired += 1
            listeners.add(callbacks)
            if (state.status === 'fulfilled') callbacks.onfulfilled?.(state.data)
            if (state.status === 'rejected') callbacks.onError?.(state.error)
          }),
          () =>
            Effect.sync(() => {
              acquired -= 1
              listeners.delete(callbacks)
            }),
        ),
    },
    settle: (next: UseAllState<DynamicTableRow>) => {
      state = next
      for (const listener of listeners) {
        if (next.status === 'fulfilled') listener.onfulfilled?.(next.data)
        if (next.status === 'rejected') listener.onError?.(next.error)
      }
    },
    ready: () => Effect.runSync(Deferred.succeed(ready, [])),
  }
}
const fulfilled = (data: DynamicTableRow[]): UseAllState<DynamicTableRow> => ({
  status: 'fulfilled',
  data,
  error: null,
})
const rejected: UseAllState<DynamicTableRow> = {
  status: 'rejected',
  data: undefined,
  error: new Error('message credit exceeds outstanding balance'),
}

// Retired cleanup cannot close leases acquired by a pending-clear reconnect.
{
  const old = source()
  const next = source()
  const exploration = createExploration({
    canonicalQuery: (candidate) => (candidate === client ? old.descriptor : next.descriptor),
  })
  const access = { ...connection, client, schema }
  const disconnect = exploration.connect(access)
  const input = { schema, origin: connection.origin, scopeKey: 'a', intent }
  const offOld = exploration
    .createView()
    .query({ ...input, client })
    .subscribe(() => {})
  const offNext = exploration
    .createView()
    .query({ ...input, client: replacement })
    .subscribe(() => {})
  const pending = exploration.navigate({ intent, policy: 'replace', commit: () => {} })
  assert.equal(exploration.getSnapshot().pendingTableName, 'items')
  let reconnected = false
  const offManager = exploration.subscribe(() => {
    if (reconnected === false && exploration.getSnapshot().pendingTableName === null) {
      reconnected = true
      exploration.connect({ ...access, client: replacement })
    }
  })
  disconnect()
  assert.equal(await pending, 'superseded')
  assert.equal(reconnected, true)
  assert.deepEqual([old.acquired, next.acquired], [0, 1])
  offOld()
  offNext()
  offManager()
  assert.deepEqual([old.acquired, next.acquired], [0, 0])
}

// Cached rejection can reconnect during acquisition without losing the newer release.
for (const kind of ['query', 'row'] as const) {
  const native = source()
  native.settle(rejected)
  const exploration = createExploration({ canonicalQuery: () => native.descriptor })
  let replacements = 0
  const access = {
    ...connection,
    client,
    schema,
    replaceRuntime: () => {
      replacements += 1
    },
  }
  exploration.connect(access)
  let reconnected = false
  const offManager = exploration.subscribe(() => {
    if (reconnected === false) {
      reconnected = true
      exploration.connect(access)
    }
  })
  const input = { client, schema, origin: connection.origin }
  const handle =
    kind === 'query'
      ? exploration.createView().query({ ...input, scopeKey: 'a', intent })
      : exploration.row({ ...input, tableName: 'items', rowId: 'a' })
  const off = handle.subscribe(() => {})
  assert.equal(reconnected, true)
  assert.equal(replacements, 1)
  assert.equal(native.acquired, 1)
  reconnected = false
  exploration.retry()
  assert.equal(reconnected, true)
  assert.equal(replacements, 2)
  assert.equal(native.acquired, 1)
  off()
  assert.equal(native.acquired, 0, kind)
  offManager()
}

// Publication cannot authorize a replacement on a later target.
for (const action of ['observe', 'retry'] as const) {
  const native = source()
  const exploration = createExploration({ canonicalQuery: () => native.descriptor })
  let originalReplacements = 0
  let nextReplacements = 0
  exploration.connect({
    ...connection,
    client,
    schema,
    replaceRuntime: () => {
      originalReplacements += 1
    },
  })
  const off = exploration
    .createView()
    .query({
      client,
      schema,
      origin: connection.origin,
      scopeKey: 'a',
      intent,
    })
    .subscribe(() => {})
  if (action === 'retry') native.settle(rejected)
  originalReplacements = 0
  let switched = false
  const offManager = exploration.subscribe(() => {
    if (switched === true) return
    switched = true
    exploration.connect({
      ...connection,
      targetKey: 'next',
      client: replacement,
      schema,
      replaceRuntime: () => {
        nextReplacements += 1
      },
    })
  })
  if (action === 'observe') native.settle(rejected)
  else exploration.retry()
  assert.equal(switched, true)
  assert.deepEqual([originalReplacements, nextReplacements], [0, 0], action)
  off()
  offManager()
}

// One budget covers both views; replacement failure exhausts it.
{
  const native = source()
  const exploration = createExploration({ canonicalQuery: () => native.descriptor })
  let retries = 0
  const access = {
    ...connection,
    client,
    schema,
    replaceRuntime: () => {
      retries += 1
    },
  }
  const a = exploration
    .createView()
    .query({ client, schema, origin: connection.origin, scopeKey: 'a', intent })
  const b = exploration
    .createView()
    .query({ client, schema, origin: connection.origin, scopeKey: 'b', intent })
  a.getSnapshot()
  assert.equal(native.acquired, 0)
  const offA = a.subscribe(() => {})
  assert.equal(native.acquired, 0)
  const disconnect = exploration.connect(access)
  assert.equal(native.acquired, 1)
  const offB = b.subscribe(() => {})
  assert.equal(native.acquired, 2)
  native.settle(rejected)
  assert.equal(retries, 1)
  disconnect()
  assert.equal(native.acquired, 0)
  const reconnect = exploration.connect(access)
  assert.equal(exploration.getSnapshot().recoveryStatus, 'recovering')
  assert.equal(retries, 1)
  reconnect()
  exploration.connect({ ...access, client: replacement })
  const replacementHandle = exploration
    .createView()
    .query({ client: replacement, schema, origin: connection.origin, scopeKey: 'a', intent })
  const offReplacement = replacementHandle.subscribe(() => {})
  assert.equal(exploration.getSnapshot().recoveryStatus, 'exhausted')
  native.settle(fulfilled([]))
  assert.equal(exploration.getSnapshot().recoveryStatus, 'idle')
  offA()
  offB()
  offReplacement()
  const stale = a.subscribe(() => {})
  assert.equal(native.acquired, 0)
  stale()
  const replay = replacementHandle.subscribe(() => {})
  assert.equal(native.acquired, 1)
  replay()
  assert.equal(native.acquired, 0)
}

// A replacement attempt cannot commit its retired predecessor.
{
  const first = source()
  const second = source()
  let index = 0
  let commits = 0
  const commitStarted = Deferred.makeUnsafe<void>()
  const commitDone = Deferred.makeUnsafe<void>()
  const exploration = createExploration({
    canonicalQuery: () => (index++ === 0 ? first.descriptor : second.descriptor),
  })
  exploration.connect({ ...connection, client, schema })
  const old = exploration.navigate({
    intent,
    policy: 'replace',
    commit: () => {
      commits += 10
    },
  })
  const next = exploration.navigate({
    intent,
    policy: 'replace',
    commit: async () => {
      assert.ok(second.acquired > 0)
      commits += 1
      Effect.runSync(Deferred.succeed(commitStarted, undefined))
      await Effect.runPromise(Deferred.await(commitDone))
    },
  })
  first.ready()
  second.ready()
  await Effect.runPromise(Deferred.await(commitStarted))
  assert.ok(second.acquired > 0)
  Effect.runSync(Deferred.succeed(commitDone, undefined))
  assert.equal(await old, 'superseded')
  assert.equal(await next, 'committed')
  assert.equal(commits, 1)
  assert.equal(first.acquired, 0)
  assert.equal(second.acquired, 0)
}

// Only an observed probe page prefetches; page correction fires once.
{
  const native = source()
  const probe = source('next-key')
  let descriptors = 0
  let corrections = 0
  const exploration = createExploration({
    canonicalQuery: () => (descriptors++ === 0 ? native.descriptor : probe.descriptor),
  })
  exploration.connect({ ...connection, client, schema })
  const view = exploration.createView()
  const handle = view.query({
    client,
    schema,
    origin: connection.origin,
    scopeKey: 'a',
    intent: { ...intent, page: 2 },
    onPageOutOfRange: () => {
      corrections += 1
    },
  })
  const stop = handle.subscribe(() => {})
  native.settle(fulfilled(Array.from({ length: 101 }, (_, id) => ({ id: String(id) }))))
  assert.equal(handle.getSnapshot().rows.length, 100)
  assert.equal(probe.acquired, 1)
  probe.settle(fulfilled([]))
  assert.equal(probe.acquired, 0)
  exploration.connect({ ...connection, client, schema })
  assert.equal(probe.acquired, 0)
  probe.settle(pending)
  exploration.connect({ ...connection, client, schema })
  assert.equal(probe.acquired, 1)
  probe.settle(rejected)
  assert.equal(probe.acquired, 0)
  native.settle(fulfilled([]))
  native.settle(fulfilled([]))
  assert.equal(corrections, 1)
  const retainedRows = [{ id: 'retained' }]
  native.settle(fulfilled(retainedRows))
  stop()
  assert.equal(probe.acquired, 0)
  probe.settle(pending)
  const sorted = view.query({
    client,
    schema,
    origin: connection.origin,
    scopeKey: 'a',
    intent: { ...intent, page: 2, sortDirection: 'desc' },
  })
  assert.equal(sorted.getSnapshot().status, 'refreshing')
  assert.deepEqual(sorted.getSnapshot().rows, retainedRows)
  assert.equal(sorted.getSnapshot(), sorted.getSnapshot())
  const otherScope = view.query({
    client,
    schema,
    origin: connection.origin,
    scopeKey: 'b',
    intent: { ...intent, page: 2, sortDirection: 'desc' },
  })
  assert.equal(otherScope.getSnapshot().status, 'loading')
}

// A committed origin retires subscribed handles before their host cleans them up.
{
  const native = source()
  const exploration = createExploration({ canonicalQuery: () => native.descriptor })
  let corrections = 0
  exploration.connect({ ...connection, client, schema })
  const offTable = exploration
    .createView()
    .query({
      client,
      schema,
      origin: connection.origin,
      scopeKey: 'a',
      intent: { ...intent, page: 2 },
      onPageOutOfRange: () => {
        corrections += 1
      },
    })
    .subscribe(() => {})
  const offRow = exploration
    .row({
      client,
      schema,
      origin: connection.origin,
      tableName: 'items',
      rowId: 'a',
    })
    .subscribe(() => {})
  const retiredCallbacks = native.callbacks
  exploration.connect({ ...connection, client, schema, origin: 'other-route' })
  assert.equal(native.acquired, 0)
  native.settle(fulfilled([]))
  for (const callback of retiredCallbacks) callback.onfulfilled?.([])
  assert.equal(corrections, 0)
  native.settle(rejected)
  for (const callback of retiredCallbacks) callback.onError?.(rejected.error)
  assert.equal(exploration.getSnapshot().recoveryStatus, 'idle')
  offTable()
  offRow()
}
