import assert from 'node:assert/strict'

import { Deferred, Effect, Exit, Fiber, Scope, Stream } from 'effect'
import type { WasmSchema } from 'jazz-tools'

import { observeQueryRecovery, openSession } from '../src/studio/session.ts'

const schema: WasmSchema = { records: { columns: [] } }

// These resource ports test Studio coordination, not Jazz authentication or storage.
// @lat: [[runtimeConnectionStartup#Runtime ownership]]
await Effect.runPromise(
  Effect.scoped(
    Effect.gen(function* () {
      const verified = yield* Deferred.make<WasmSchema>()
      const acquired = yield* Deferred.make<void>()
      let releases = 0
      const owner = yield* Scope.make()
      const session = yield* openSession({
        acquireClient: Effect.acquireRelease(
          Effect.sync(() => ({ identity: 'owned-client' })).pipe(
            Effect.tap(() => Deferred.succeed(acquired, undefined)),
          ),
          () =>
            Effect.sync(() => {
              releases += 1
            }),
        ),
        loadSchema: Deferred.await(verified),
        loadPermissions: Effect.fail('permission document unavailable'),
      }).pipe(Effect.provideService(Scope.Scope, owner))
      yield* Deferred.await(acquired)
      assert.equal((yield* session.snapshot).status, 'opening')
      assert.equal(releases, 0)
      yield* Deferred.succeed(verified, schema)
      yield* Stream.runHead(
        session.changes.pipe(
          Stream.filter(
            (state) => state.status === 'active' && state.permissions.status === 'failed',
          ),
        ),
      )
      const active = yield* session.snapshot
      assert.equal(active.status, 'active')
      assert.equal(active.schema.status, 'ready')
      yield* session.failClient(new Error('terminal transport failure'))
      assert.equal((yield* session.snapshot).status, 'failed')
      assert.equal(releases, 1)
      yield* Scope.close(owner, Exit.void)
      assert.equal((yield* session.snapshot).status, 'closed')
      assert.equal(releases, 1)
    }),
  ).pipe(Effect.timeout('5 seconds')),
)

// A schema failure is visible even while an uncancellable acquisition is pending.
await Effect.runPromise(
  Effect.scoped(
    Effect.gen(function* () {
      const started = yield* Deferred.make<void>()
      const acquired = yield* Deferred.make<string>()
      const rejectSchema = yield* Deferred.make<WasmSchema, string>()
      let releases = 0
      const owner = yield* Scope.make()
      const session = yield* openSession({
        acquireClient: Effect.acquireRelease(
          Deferred.succeed(started, undefined).pipe(Effect.andThen(Deferred.await(acquired))),
          () =>
            Effect.sync(() => {
              releases += 1
            }),
        ),
        loadSchema: Deferred.await(rejectSchema),
        loadPermissions: Effect.succeed(null),
      }).pipe(Effect.provideService(Scope.Scope, owner))
      yield* Deferred.await(started)
      yield* Deferred.fail(rejectSchema, 'schema rejected')
      const failure = yield* Effect.exit(
        Stream.runHead(
          session.changes.pipe(Stream.filter((state) => state.status === 'failed')),
        ).pipe(Effect.timeout('1 second')),
      )
      yield* Deferred.succeed(acquired, 'late-client')
      yield* Scope.close(owner, Exit.void)
      assert.equal(Exit.isSuccess(failure), true)
      assert.equal(releases, 1)
    }),
  ),
)

// Late acquisition must be released without publishing into a retired session.
await Effect.runPromise(
  Effect.scoped(
    Effect.gen(function* () {
      const started = yield* Deferred.make<void>()
      const acquired = yield* Deferred.make<{ identity: string }>()
      let releases = 0
      const owner = yield* Scope.make()
      const session = yield* openSession({
        acquireClient: Effect.acquireRelease(
          Deferred.succeed(started, undefined).pipe(Effect.andThen(Deferred.await(acquired))),
          () =>
            Effect.sync(() => {
              releases += 1
            }),
        ),
        loadSchema: Effect.succeed(schema),
        loadPermissions: Effect.succeed(null),
      }).pipe(Effect.provideService(Scope.Scope, owner))
      const transitions: string[] = []
      const observing = yield* Deferred.make<void>()
      const observedClosed = yield* Deferred.make<void>()
      yield* Effect.forkScoped(
        Stream.runForEach(session.changes, (state) =>
          Effect.gen(function* () {
            transitions.push(state.status)
            yield* Deferred.succeed(observing, undefined)
            if (state.status === 'closed') yield* Deferred.succeed(observedClosed, undefined)
          }),
        ),
      )
      yield* Deferred.await(observing)
      yield* Deferred.await(started)
      const closing = yield* Effect.forkScoped(Scope.close(owner, Exit.void))
      yield* Effect.yieldNow
      yield* Deferred.succeed(acquired, { identity: 'late-client' })
      yield* Fiber.join(closing)
      yield* Deferred.await(observedClosed)
      assert.equal(releases, 1)
      assert.equal((yield* session.snapshot).status, 'closed')
      assert.equal(transitions.includes('active'), false)
    }),
  ).pipe(Effect.timeout('5 seconds')),
)

await Effect.runPromise(
  Effect.scoped(
    Effect.gen(function* () {
      const acquired = yield* Deferred.make<void>()
      const rejectSchema = yield* Deferred.make<WasmSchema, string>()
      let releases = 0
      const session = yield* openSession({
        acquireClient: Effect.acquireRelease(
          Deferred.succeed(acquired, undefined).pipe(Effect.as('owned-client')),
          () =>
            Effect.sync(() => {
              releases += 1
            }),
        ),
        loadSchema: Deferred.await(rejectSchema),
        loadPermissions: Effect.succeed(null),
      })
      yield* Deferred.await(acquired)
      yield* Deferred.fail(rejectSchema, 'schema rejected')
      yield* Stream.runHead(
        session.changes.pipe(Stream.filter((state) => state.status === 'failed')),
      )
      const failed = yield* session.snapshot
      assert.equal(failed.status, 'failed')
      if (failed.status === 'failed') assert.equal(failed.error.source, 'schema')
      assert.equal(releases, 1)
    }),
  ).pipe(Effect.timeout('5 seconds')),
)

// @lat: [[tableQueries#Failure and evidence limits]]
const original = { id: 'original' }
const replacement = { id: 'replacement' }
const recovering = observeQueryRecovery({ status: 'idle' }, original, {
  status: 'rejected',
  client: original,
  recoverableTransportFailure: true,
})
assert.equal(recovering.replace, true)
assert.equal(recovering.state.status, 'recovering')
assert.equal(
  observeQueryRecovery(recovering.state, replacement, { status: 'fulfilled', client: original })
    .state,
  recovering.state,
)
const exhausted = observeQueryRecovery(recovering.state, replacement, {
  status: 'rejected',
  client: replacement,
  recoverableTransportFailure: true,
})
assert.deepEqual(exhausted, { state: { status: 'exhausted' }, replace: false })
assert.deepEqual(
  observeQueryRecovery(exhausted.state, replacement, { status: 'fulfilled', client: replacement }),
  { state: { status: 'idle' }, replace: false },
)

console.log('Passed: session publication, scoped cleanup, late acquisition, and bounded recovery.')
console.log('Coordination ports only: no Jazz authentication or storage guarantee is inferred.')
