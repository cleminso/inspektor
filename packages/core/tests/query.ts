import assert from 'node:assert/strict'
import { Deferred, Effect, Exit, Scope, Stream } from 'effect'
import { TypedTableQueryBuilder, type WasmSchema } from 'jazz-tools'
import { createJazzClient } from 'jazz-tools/backend'
import { startTestJazz, testApp } from 'jazz-tools/testing'
import { canonicalQuery, QueryFailure } from '../src/jazz/query.ts'
import {
  buildTableRowsQuery,
  buildTableRowsQueryFromSearch,
  buildTableRowByIdQuery,
  projectTablePage,
  projectTableResult,
  projectRowById,
  parseTableFilterValue,
  parseFilterValue,
  filterTableFilterClauses,
  createTableNavigationPreparation,
  type DynamicTableMeta,
  type TableResultIdentity,
} from '../src/studio/query.ts'

const schema: WasmSchema = {
  items: {
    columns: [
      { name: 'title', column_type: { type: 'Text' }, nullable: false },
      { name: 'score', column_type: { type: 'Integer' }, nullable: false },
      { name: 'payload', column_type: { type: 'Json' }, nullable: true },
    ],
  },
}
const intent = {
  tableName: 'items',
  filters: [{ column: 'score', operator: 'gte', value: '2' }],
  sortColumn: 'title',
  sortDirection: 'desc',
  page: 2,
  pageSize: 100,
} as const

const query = await Effect.runPromise(buildTableRowsQuery({ schema, intent }))
const built = JSON.parse(query._build())
// @lat: [[tableQueries#Pagination]] — request the probe row, not a separate count.
assert.equal(built.limit, 101)
assert.equal(built.offset, 100)
assert.deepEqual(built.orderBy, [
  ['title', 'desc'],
  ['id', 'asc'],
])
assert.deepEqual(built.conditions, [{ column: 'score', op: 'gte', value: 2 }])
assert.deepEqual(built.select, ['*', '$createdAt', '$createdBy', '$updatedAt', '$updatedBy'])
for (const pageSize of [500, 1000] as const) {
  const large = await Effect.runPromise(
    buildTableRowsQuery({ schema, intent: { ...intent, pageSize } }),
  )
  assert.equal(JSON.parse(large._build()).limit, pageSize + 1)
}
for (const invalid of [
  { ...intent, page: 0 },
  { ...intent, filters: [{ column: 'missing', operator: 'eq', value: 'x' }] },
  { ...intent, filters: [{ column: 'score', operator: 'contains', value: 'x' }] },
  { ...intent, filters: [{ column: 'score', operator: 'eq', value: 'NaN' }] },
  { ...intent, filters: [{ column: 'title', operator: 'eq', value: undefined }] },
] as const) {
  assert.equal(
    Exit.isFailure(await Effect.runPromiseExit(buildTableRowsQuery({ schema, intent: invalid }))),
    true,
  )
}
const byId = await Effect.runPromise(
  buildTableRowByIdQuery({ schema, tableName: 'items', rowId: 'row-a' }),
)
// @lat: [[tableQueries#Query identity]] — unsupported sorting falls back to ascending ID.
for (const sortColumn of ['payload', 'missing', '$createdBy']) {
  const fallback = await Effect.runPromise(
    buildTableRowsQuery({ schema, intent: { ...intent, sortColumn } }),
  )
  assert.deepEqual(JSON.parse(fallback._build()).orderBy, [['id', 'asc']])
}
assert.deepEqual(JSON.parse(byId._build()).conditions, [{ column: 'id', op: 'eq', value: 'row-a' }])
assert.equal(JSON.parse(byId._build()).limit, 1)
const rows = Array.from({ length: 101 }, (_, id) => ({ id: String(id) }))
assert.equal(projectTablePage(rows, 100).rows.length, 100)
assert.equal(projectTablePage(rows, 100).hasNextPage, true)
assert.deepEqual(projectTablePage([], 100), { rows: [], hasNextPage: false })
assert.equal(typeof canonicalQuery, 'function')

const identity: TableResultIdentity = {
  runtime: {},
  schema,
  scopeKey: 'workspace-a',
  intent,
  queryKey: 'query-a',
}
const fulfilled = { status: 'fulfilled', data: [{ id: 'row-a', title: 'A' }], error: null } as const
const settled = projectTableResult({
  identity,
  state: { ...fulfilled, data: [...fulfilled.data] },
})
assert.equal(settled.status, 'rows')
if (settled.status !== 'rows') throw new Error('Expected rows.')
const pending = {
  status: 'pending',
  data: undefined,
  error: null,
  promise: Object.assign(new Promise<never>(() => {}), { status: 'pending' as const }),
} as const
const sorted = {
  ...identity,
  queryKey: 'query-b',
  intent: { ...intent, sortDirection: 'asc' as const },
}
// @lat: [[exploreTables#Read result state]] — retain a compatible sort page, never merge rows.
const refreshing = projectTableResult({ identity: sorted, state: pending, previous: settled.page })
assert.equal(refreshing.status, 'refreshing')
if (refreshing.status !== 'refreshing') throw new Error('Expected refresh.')
assert.equal(refreshing.page, settled.page)
for (const incompatible of [
  identity,
  { ...sorted, runtime: {} },
  { ...sorted, schema: { ...schema } },
  { ...sorted, scopeKey: 'workspace-b' },
  { ...sorted, intent: { ...sorted.intent, page: 3 } },
  { ...sorted, intent: { ...sorted.intent, pageSize: 500 as const } },
  { ...sorted, intent: { ...sorted.intent, filters: [] } },
  { ...sorted, intent: { ...sorted.intent, tableName: 'other' } },
]) {
  assert.deepEqual(
    projectTableResult({
      identity: incompatible,
      state: pending,
      previous: settled.page,
    }),
    { status: 'loading' },
  )
}
const failure = new Error('query failed')
const rejected = { status: 'rejected', data: undefined, error: failure } as const
assert.deepEqual(
  projectTableResult({
    identity: sorted,
    state: rejected,
    previous: settled.page,
  }),
  { status: 'rejected', error: failure },
)
const empty = projectTableResult({
  identity,
  state: { status: 'fulfilled', data: [], error: null },
})
assert.equal(empty.status, 'empty')
if (empty.status !== 'empty') throw new Error('Expected empty.')
assert.equal(empty.correctPage, true)
assert.equal(empty.prepareNextPage, false)
const fullPage = projectTableResult({
  identity,
  state: { status: 'fulfilled', data: rows, error: null },
})
if (fullPage.status !== 'rows') throw new Error('Expected rows.')
assert.equal(fullPage.prepareNextPage, true)
assert.deepEqual(projectRowById({ ...fulfilled, data: [...fulfilled.data] }, 'other'), {
  status: 'fulfilled',
  row: null,
})
assert.deepEqual(projectRowById(rejected, 'row-a'), { status: 'rejected', error: failure })
assert.equal(
  parseTableFilterValue(
    {
      column_type: { type: 'Text' },
      nullable: false,
    },
    'eq',
    '  keep spaces  ',
  ),
  '  keep spaces  ',
)
assert.deepEqual(
  parseTableFilterValue(
    {
      column_type: { type: 'Integer' },
      nullable: false,
    },
    'in',
    ['2', '3'],
  ),
  [2, 3],
)
console.log('query intent and presentation tests passed')

// URL boundary parity: stale clauses are pruned, and equality text remains literal.
assert.equal(
  parseFilterValue({ column_type: { type: 'Text' }, nullable: false }, 'eq', '  text  '),
  'text',
)
const applicable = filterTableFilterClauses({
  schema,
  tableName: 'items',
  filters: [
    { id: 'spaces', column: 'title', operator: 'eq', value: '  ' },
    { id: 'stale', column: 'gone', operator: 'eq', value: 'x' },
    { id: 'invalid', column: 'score', operator: 'contains', value: 'x' },
    { id: 'tokens', column: 'score', operator: 'in', value: ['', ' 2 ', '3'] },
  ],
})
assert.deepEqual(applicable, [
  { id: 'spaces', column: 'title', operator: 'eq', value: '  ' },
  { id: 'tokens', column: 'score', operator: 'in', value: [2, 3] },
])
const jsonSearchIntent = {
  ...intent,
  filters: [{ column: 'payload', operator: 'eq', value: '"  2  "' }],
} as const
const jsonSearchQuery = await Effect.runPromise(
  buildTableRowsQueryFromSearch({ schema, intent: jsonSearchIntent }),
)
assert.equal(JSON.parse(jsonSearchQuery._build()).conditions[0].value, '  2  ')
const staleSearchQuery = await Effect.runPromise(
  buildTableRowsQueryFromSearch({
    schema,
    intent: { ...intent, filters: [{ column: 'gone', operator: 'eq', value: 'x' }] },
  }),
)
assert.deepEqual(JSON.parse(staleSearchQuery._build()).conditions, [])
assert.deepEqual(
  parseTableFilterValue(
    {
      column_type: { type: 'Bytea' },
      nullable: false,
    },
    'eq',
    new Uint8Array(),
  ),
  new Uint8Array(),
)

// Non-Jazz coordination ports test policy only, not SDK subscription guarantees.
const pendingNames: Array<string | null> = []
const coordinator = createTableNavigationPreparation<string>((name) => pendingNames.push(name))
const queryEntered = Deferred.makeUnsafe<void>()
const queryGate = Deferred.makeUnsafe<void>()
let releases = 0
let commits = 0
let diagnoses = 0
let repairs = 0
const nonJazzPorts = {
  policy: 'replace' as const,
  tableName: 'first',
  query: Effect.gen(function* () {
    yield* Effect.acquireRelease(Effect.void, () =>
      Effect.sync(() => {
        releases += 1
      }),
    )
    yield* Deferred.succeed(queryEntered, undefined)
    yield* Deferred.await(queryGate)
  }),
  diagnose: Effect.sync(() => {
    diagnoses += 1
    return { status: 'reachable' as const }
  }),
  repair: (_reason: string) =>
    Effect.sync(() => {
      repairs += 1
    }),
  commit: Effect.sync(() => {
    commits += 1
  }),
}
const firstAttempt = Effect.runPromise(coordinator.prepare(nonJazzPorts))
await Effect.runPromise(Deferred.await(queryEntered))
assert.equal(
  await Effect.runPromise(coordinator.prepare({ ...nonJazzPorts, policy: 'ignore' })),
  'busy',
)
assert.equal(
  await Effect.runPromise(
    coordinator.prepare({
      ...nonJazzPorts,
      tableName: 'second',
      query: Effect.void,
    }),
  ),
  'committed',
)
assert.equal(await firstAttempt, 'superseded')
await Effect.runPromise(Deferred.succeed(queryGate, undefined))
assert.equal(commits, 1)
assert.equal(releases, 1)
assert.equal(diagnoses, 0)
assert.equal(repairs, 0)
assert.equal(pendingNames.at(-1), null)

const originalFailure = new Error('non-Jazz query port failure')
const failedResult = await Effect.runPromise(
  coordinator
    .prepare({
      ...nonJazzPorts,
      query: Effect.fail(originalFailure),
    })
    .pipe(Effect.catch((error) => Effect.succeed(error))),
)
assert.equal(failedResult, originalFailure)
assert.equal(diagnoses, 1)
assert.equal(
  await Effect.runPromise(
    coordinator.prepare({
      ...nonJazzPorts,
      query: Effect.fail(originalFailure),
      diagnose: Effect.succeed({ status: 'connectionFailure', reason: 'credentials' }),
    }),
  ),
  'recovery',
)
assert.equal(repairs, 1)
assert.equal(commits, 1)

const diagnosisEntered = Deferred.makeUnsafe<void>()
let diagnosisAborted = false
const diagnosisPending = Effect.runPromise(
  coordinator.prepare({
    ...nonJazzPorts,
    query: Effect.fail(originalFailure),
    diagnose: Effect.gen(function* () {
      yield* Deferred.succeed(diagnosisEntered, undefined)
      return yield* Effect.tryPromise({
        try: (signal) =>
          new Promise<never>(() => {
            signal.addEventListener(
              'abort',
              () => {
                diagnosisAborted = true
              },
              { once: true },
            )
          }),
        catch: (error) => error,
      })
    }),
  }),
)
await Effect.runPromise(Deferred.await(diagnosisEntered))
await Effect.runPromise(coordinator.cancel)
assert.equal(await diagnosisPending, 'superseded')
assert.equal(diagnosisAborted, true)
assert.equal(repairs, 1)
assert.equal(commits, 1)
assert.equal(pendingNames.at(-1), null)
const diagnosisFailure = await Effect.runPromise(
  coordinator
    .prepare({
      ...nonJazzPorts,
      query: Effect.fail(originalFailure),
      diagnose: Effect.fail(new Error('non-Jazz diagnosis port failure')),
    })
    .pipe(Effect.catch((error) => Effect.succeed(error))),
)
assert.equal(diagnosisFailure, originalFailure)
const commitFailure = new Error('non-Jazz commit port failure')
const releasedBeforeCommitFailure = releases
const commitFailureResult = await Effect.runPromise(
  coordinator
    .prepare({
      ...nonJazzPorts,
      query: Effect.acquireRelease(Effect.void, () =>
        Effect.sync(() => {
          releases += 1
        }),
      ),
      commit: Effect.fail(commitFailure),
    })
    .pipe(Effect.catch((error) => Effect.succeed(error))),
)
assert.equal(commitFailureResult, commitFailure)
assert.equal(releases, releasedBeforeCommitFailure + 1)
assert.equal(pendingNames.at(-1), null)
console.log('non-Jazz navigation coordination tests passed')

async function runBounded<A, E>(effect: Effect.Effect<A, E>): Promise<A> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    return await Effect.runPromise(effect, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// Real local public Jazz fixture. No external services or disk persistence.
const app = testApp({ tables: { records: { columns: { title: 'string' } } } })
const permissions = {
  format: 1,
  tables: { records: { read: 'true', insert: 'true', update: 'true', delete: 'true' } },
}
const server = await startTestJazz({
  app,
  permissions,
  coreOptions: { host: '127.0.0.1', inMemory: true, enableLogs: false },
})
try {
  const session = await createJazzClient({
    app,
    permissions,
    serverUrl: server.url,
    initial: 'device',
    driver: { type: 'memory' },
  })
  try {
    const client = session.getSnapshot().client
    assert.ok(client)
    const realIntent = {
      tableName: 'records',
      filters: [],
      sortColumn: 'id',
      sortDirection: 'asc',
      page: 1,
      pageSize: 100,
    } as const
    const firstBuilder = await Effect.runPromise(
      buildTableRowsQuery({ schema: app.records._schema, intent: realIntent }),
    )
    const sameBuilder = await Effect.runPromise(
      buildTableRowsQuery({ schema: app.records._schema, intent: realIntent }),
    )
    const firstDescriptor = canonicalQuery(client, firstBuilder)
    const sameDescriptor = canonicalQuery(client, sameBuilder)
    assert.equal(firstDescriptor.key, sameDescriptor.key)
    const listenerScope = Scope.makeUnsafe()
    let callbacks = 0
    try {
      const firstEntry = Effect.runSync(
        Scope.provide(
          firstDescriptor.acquire({
            onfulfilled: () => {
              callbacks += 1
            },
            onDelta: () => {
              callbacks += 1
            },
          }),
          listenerScope,
        ),
      )
      const sameEntry = Effect.runSync(Scope.provide(sameDescriptor.acquire(), listenerScope))
      assert.equal(firstEntry, sameEntry)
      await runBounded(firstDescriptor.prepare)
      assert.equal(firstDescriptor.getSnapshot(), sameDescriptor.getSnapshot())
      const observed = runBounded(
        firstDescriptor.observe.pipe(
          Stream.filter(
            (state) =>
              state.status === 'fulfilled' && state.data.some((row) => row.title === 'observed'),
          ),
          Stream.take(1),
          Stream.runCollect,
        ),
      )
      await session.db
        .insert(app.records, { title: 'observed' })
        .wait({ tier: 'global', timeoutMs: 5000 })
      const snapshots = await observed
      const snapshot = snapshots[0]
      assert.equal(snapshot?.status, 'fulfilled')
      if (snapshot?.status !== 'fulfilled') throw new Error('Expected canonical rows.')
      assert.ok(snapshot.data.find((row) => row.title === 'observed')?.$createdAt instanceof Date)
    } finally {
      Effect.runSync(Scope.close(listenerScope, Exit.void))
    }
    const afterRelease = callbacks
    const streamController = new AbortController()
    const streamEntered = Deferred.makeUnsafe<void>()
    let streamDeliveries = 0
    const cancelledStream = Effect.runPromiseExit(
      firstDescriptor.observe.pipe(
        Stream.tap(() =>
          Effect.gen(function* () {
            streamDeliveries += 1
            yield* Deferred.succeed(streamEntered, undefined)
          }),
        ),
        Stream.runDrain,
      ),
      { signal: streamController.signal },
    )
    await runBounded(Deferred.await(streamEntered))
    streamController.abort()
    assert.equal(Exit.isFailure(await cancelledStream), true)
    const afterStreamCancellation = streamDeliveries
    const afterReleaseObservation = runBounded(
      firstDescriptor.observe.pipe(
        Stream.filter(
          (state) =>
            state.status === 'fulfilled' && state.data.some((row) => row.title === 'after-release'),
        ),
        Stream.take(1),
        Stream.runCollect,
      ),
    )
    await session.db
      .insert(app.records, { title: 'after-release' })
      .wait({ tier: 'global', timeoutMs: 5000 })
    await afterReleaseObservation
    assert.equal(callbacks, afterRelease)
    assert.equal(streamDeliveries, afterStreamCancellation)
    const invalidDescriptor = canonicalQuery(
      client,
      new TypedTableQueryBuilder<DynamicTableMeta>('missing', app.records._schema),
    )
    const invalidResult = await runBounded(
      invalidDescriptor.prepare.pipe(Effect.catch((error) => Effect.succeed(error))),
    )
    assert.ok(invalidResult instanceof QueryFailure)
    assert.equal(invalidDescriptor.getSnapshot().status, 'rejected')
    console.log(
      'real Jazz canonical identity, preparation, stream, failure, and listener cleanup passed',
    )
  } finally {
    await session.close({ timeoutMs: 0 })
  }
} finally {
  await server.stop()
}
console.log(
  'Not checked: authoritative replay completeness, remote transport recovery, React mounting, disk/restart persistence.',
)
