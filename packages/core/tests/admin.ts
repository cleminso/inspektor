import assert from 'node:assert/strict'

import { Effect, Stream } from 'effect'
import { TypedTableQueryBuilder } from 'jazz-tools'
import { startTestJazz, testApp } from 'jazz-tools/testing'

import { acquireAdminClient } from '../src/jazz/client.ts'
import { canonicalQuery, QueryFailure } from '../src/jazz/query.ts'
import type { DynamicTableMeta } from '../src/studio/query.ts'
import { openSession } from '../src/studio/session.ts'

const app = testApp({
  tables: { records: { columns: { title: 'string' } } },
})
const permissions = {
  format: 1,
  tables: { records: { read: 'true', insert: 'false', update: 'false', delete: 'false' } },
}
const failures: unknown[] = []

// Await startup directly: no late acquisition may escape cleanup ownership.
const server = await startTestJazz({
  app,
  permissions,
  coreOptions: { host: '127.0.0.1', inMemory: true, enableLogs: false },
})
try {
  assert.equal(new URL(server.core.url).hostname, '127.0.0.1')
  const access = {
    acquireClient: acquireAdminClient({
      appId: server.core.appId,
      serverUrl: server.core.url,
      adminSecret: server.core.adminSecret,
    }),
    loadSchema: Effect.succeed(app.records._schema),
    loadPermissions: Effect.succeed(null),
  }
  // @lat: [[runtimeConnectionStartup#Runtime ownership]]
  const retained = await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const session = yield* openSession(access)
        const states = yield* session.changes.pipe(
          Stream.filter((state) => state.status === 'active' || state.status === 'failed'),
          Stream.take(1),
          Stream.runCollect,
          Effect.timeout('8 seconds'),
        )
        const state = states[0]
        assert.ok(state !== undefined)
        if (state.status === 'failed') throw state.error
        assert.equal(state.status, 'active')
        assert.ok(state.status === 'active')
        const client = state.client
        // Write denial for ordinary accounts makes this a privileged-path check.
        const write = client.db.insert(app.records, { title: 'admin-only-write' })
        yield* Effect.tryPromise(() => write.wait({ tier: 'global', timeoutMs: 5000 }))
        const rows = yield* Effect.tryPromise(() =>
          client.db.all(app.records, { tier: 'remote' }),
        ).pipe(Effect.timeout('8 seconds'))
        assert.equal(rows.filter((row) => row.id === write.value.id).length, 1)
        console.log(
          'Passed: local real Jazz in-memory privileged acquisition, write, and remote read.',
        )

        return { session, client }
      }),
    ),
  )
  const closed = await Effect.runPromise(retained.session.snapshot)
  assert.equal(closed.status, 'closed')
  await Effect.runPromise(
    Effect.tryPromise({
      try: () => retained.client.db.all(app.records, { tier: 'remote' }),
      catch: (cause) => cause,
    }).pipe(
      Effect.match({
        onFailure: (cause) => {
          assert.ok(cause instanceof Error)
          assert.match(cause.message, /closed|shutdown|shut down/i)
        },
        onSuccess: () => assert.fail('Closed client unexpectedly read rows'),
      }),
      Effect.timeout('8 seconds'),
    ),
  )
  console.log(
    'Passed: Effect scope publishes closed session; retained client cannot read after cleanup.',
  )

  // Db teardown need not publish rejection. Exercise real subscription setup errors.
  // @lat: [[tableQueries#Failure and evidence limits]]
  await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const client = yield* access.acquireClient
        const invalid = new TypedTableQueryBuilder<DynamicTableMeta>(
          'records',
          app.records._schema,
        ).where({ absent: { eq: 'synthetic missing column' } })
        const query = canonicalQuery(client, invalid)
        yield* query.observe.pipe(
          Stream.runDrain,
          Effect.timeout('8 seconds'),
          Effect.match({
            onFailure: (error) => {
              assert.ok(error instanceof QueryFailure)
              assert.ok(error.cause instanceof Error)
              assert.match(error.cause.message, /Unknown column/i)
            },
            onSuccess: () => assert.fail('Invalid subscription unexpectedly completed'),
          }),
        )
        assert.equal(query.getSnapshot().status, 'rejected')
        yield* query.prepare.pipe(
          Effect.timeout('8 seconds'),
          Effect.match({
            onFailure: (error) => assert.ok(error instanceof QueryFailure),
            onSuccess: () => assert.fail('Invalid preparation unexpectedly succeeded'),
          }),
        )
        console.log(
          'Passed: real Jazz subscription setup rejection; observe fails QueryFailure, snapshot rejects, prepare fails.',
        )
      }),
    ),
  )
} catch (error) {
  failures.push(error)
} finally {
  try {
    await server.stop()
  } catch (error) {
    failures.push(error)
  }
}
if (failures.length > 0)
  throw new AggregateError(failures, 'Local real Jazz in-memory admin probe failed')
console.log('Passed: local server cleanup.')
console.log('Not checked: disk/restart persistence or external services.')
