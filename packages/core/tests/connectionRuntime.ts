import assert from 'node:assert/strict'
import { Deferred, Effect } from 'effect'
import type { JazzClient } from 'jazz-tools/client'
import type { WasmSchema } from 'jazz-tools'
import { createConnectionRuntime, type ConnectionExecution } from '../src/workbench/connection.ts'

const execution: ConnectionExecution = {
  id: 'profile',
  serverUrl: 'https://example.test',
  appId: 'app',
  env: 'test',
  adminSecret: 'private',
  branch: 'main',
  schemaHash: 'schema',
}
const schema: WasmSchema = { records: { columns: [] } }
// The session treats clients as opaque identities. No native Jazz operation runs here.
const client = {} as JazzClient
const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(effect)
const waitFor = (runtime: ReturnType<typeof createConnectionRuntime>, status: string) =>
  run(
    Effect.callback<void>((resume) => {
      const check = () => {
        if (runtime.getSnapshot().status === status) resume(Effect.void)
      }
      const stop = runtime.subscribe(check)
      check()
      return Effect.sync(stop)
    }).pipe(Effect.timeout('5 seconds')),
  )

// Equal execution values preserve ownership. Old attachment cleanup cannot detach a new one.
{
  let acquired = 0
  let released = 0
  const retired = Deferred.makeUnsafe<void>()
  const prepared = Deferred.makeUnsafe<void>()
  const schemaLoaded = Deferred.makeUnsafe<void>()
  const runtime = createConnectionRuntime({
    prepare: Deferred.await(prepared),
    access: () => ({
      acquireClient: Effect.acquireRelease(
        Effect.sync(() => {
          acquired += 1
          return client
        }),
        () =>
          Effect.sync(() => {
            released += 1
          }).pipe(Effect.andThen(Deferred.succeed(retired, undefined))),
      ),
      loadSchema: Deferred.succeed(schemaLoaded, undefined).pipe(Effect.as(schema)),
      loadPermissions: Effect.fail('unavailable'),
    }),
  })
  const stop = runtime.connect(execution)
  await run(Deferred.await(schemaLoaded))
  assert.equal(acquired, 0)
  assert.equal(runtime.getSnapshot().status, 'opening')
  await run(Deferred.succeed(prepared, undefined))
  await waitFor(runtime, 'active')
  const snapshot = runtime.getSnapshot()
  assert.equal(snapshot.permissions.status, 'failed')
  const detach = runtime.connect({ ...execution })
  stop()
  assert.equal(runtime.getSnapshot(), snapshot)
  assert.equal(acquired, 1)
  const changed = { ...execution, adminSecret: 'changed' }
  const mismatch = runtime.getSnapshotFor(changed)
  assert.equal(mismatch.status, 'opening')
  assert.equal(runtime.getSnapshotFor({ ...changed }), mismatch)
  assert.equal(runtime.getSnapshotFor({ ...execution }), snapshot)
  assert.equal(runtime.getSnapshotFor(null).status, 'closed')
  assert.equal(JSON.stringify(snapshot).includes(execution.adminSecret), false)
  detach()
  await run(Deferred.await(retired))
  assert.equal(released, 1)
  assert.equal(runtime.getSnapshot().status, 'closed')
  let reattach = runtime.connect(execution)
  await waitFor(runtime, 'active')
  assert.equal(acquired, 2)
  for (const change of [
    changed,
    { ...execution, branch: 'other' },
    { ...execution, schemaHash: 'other' },
  ]) {
    const stale = reattach
    reattach = runtime.connect(change)
    stale()
    await waitFor(runtime, 'active')
  }
  assert.equal(acquired, 5)
  reattach()
}

// Replacement does not wait for late acquisition and cannot publish the old client.
{
  const started = Deferred.makeUnsafe<void>()
  const late = Deferred.makeUnsafe<JazzClient>()
  const retired = Deferred.makeUnsafe<void>()
  const currentRetired = Deferred.makeUnsafe<void>()
  let count = 0
  const lateClient = {} as JazzClient
  const released: JazzClient[] = []
  const runtime = createConnectionRuntime({
    prepare: Effect.void,
    access: () => {
      count += 1
      return {
        acquireClient: Effect.acquireRelease(
          count === 1
            ? Deferred.succeed(started, undefined).pipe(Effect.andThen(Deferred.await(late)))
            : Effect.succeed(client),
          (owned) =>
            Effect.sync(() => {
              released.push(owned)
            }).pipe(
              Effect.andThen(
                Deferred.succeed(owned === client ? currentRetired : retired, undefined),
              ),
            ),
        ),
        loadSchema: Effect.succeed(schema),
        loadPermissions: Effect.succeed(null),
      }
    },
  })
  const stop = runtime.connect(execution)
  await run(Deferred.await(started))
  runtime.retry()
  await waitFor(runtime, 'active')
  const current = runtime.getSnapshot()
  await run(Deferred.succeed(late, lateClient))
  await run(Deferred.await(retired))
  assert.equal(released.length, 1)
  assert.equal(released[0], lateClient)
  assert.equal(runtime.getSnapshot(), current)
  stop()
  await run(Deferred.await(currentRetired))
  assert.equal(released.length, 2)
  assert.equal(released[1], client)
}

// Resume admission remains armed after a healthy return; late reconnect failure is stale.
{
  const initialReconnect = Deferred.makeUnsafe<void, string>()
  const reconnectStarted = Deferred.makeUnsafe<void>()
  const reconnectResult = Deferred.makeUnsafe<void, string>()
  const reconnectFinished = Deferred.makeUnsafe<void>()
  let reconnect: Effect.Effect<void, string> = Deferred.await(initialReconnect)
  let rejectAcquisition = false
  let acquired = 0
  let resumeRetries = 0
  const runtime = createConnectionRuntime({
    prepare: Effect.void,
    onResumeRetry: () => {
      resumeRetries += 1
      runtime.retry()
    },
    reconnect: () => reconnect,
    access: () => ({
      acquireClient: Effect.acquireRelease(
        Effect.suspend(() => {
          acquired += 1
          return rejectAcquisition === true
            ? Effect.fail('acquisition rejected')
            : Effect.succeed(client)
        }),
        () => Effect.void,
      ),
      loadSchema: Effect.succeed(schema),
      loadPermissions: Effect.succeed(null),
    }),
  })
  const stop = runtime.connect(execution)
  await waitFor(runtime, 'active')
  runtime.suspend()
  runtime.resume(300_000)
  assert.equal(runtime.getSnapshot().status, 'active')
  await run(Deferred.fail(initialReconnect, 'failure after return'))
  await waitFor(runtime, 'active')
  assert.equal(resumeRetries, 1)
  assert.equal(acquired, 2)
  rejectAcquisition = true
  runtime.retry()
  await waitFor(runtime, 'failed')
  assert.equal(resumeRetries, 1)
  rejectAcquisition = false
  runtime.suspend()
  runtime.resume(0)
  await waitFor(runtime, 'active')
  assert.equal(resumeRetries, 2)
  reconnect = Deferred.succeed(reconnectStarted, undefined).pipe(
    Effect.andThen(Deferred.await(reconnectResult)),
    Effect.ensuring(Deferred.succeed(reconnectFinished, undefined)),
  )
  runtime.suspend()
  runtime.resume(300_000)
  await run(Deferred.await(reconnectStarted))
  runtime.retry()
  await waitFor(runtime, 'active')
  const current = runtime.getSnapshot()
  await run(Deferred.fail(reconnectResult, 'stale reconnect'))
  await run(Deferred.await(reconnectFinished))
  await run(Effect.yieldNow)
  assert.equal(runtime.getSnapshot(), current)
  reconnect = Effect.fail('listener replaces failed attempt')
  const unsubscribe = runtime.subscribe(() => {
    if (runtime.getSnapshot().status === 'failed') runtime.retry()
  })
  runtime.suspend()
  runtime.resume(300_000)
  await waitFor(runtime, 'active')
  assert.equal(resumeRetries, 2)
  assert.equal(acquired, 6)
  unsubscribe()
  stop()
}

// Synchronous listeners can replace an attempt during publication.
{
  let acquired = 0
  let hidden = true
  const runtime = createConnectionRuntime({
    prepare: Effect.void,
    isHidden: () => hidden,
    reconnect: () => Effect.fail('initially hidden attempt fails after return'),
    access: () => ({
      acquireClient: Effect.acquireRelease(
        Effect.suspend(() => {
          acquired += 1
          return acquired === 1 ? Effect.succeed(client) : Effect.fail('replacement failed')
        }),
        () => Effect.void,
      ),
      loadSchema: Effect.succeed(schema),
      loadPermissions: Effect.succeed(null),
    }),
  })
  let replaced = false
  const unsubscribe = runtime.subscribe(() => {
    if (runtime.getSnapshot().status === 'opening' && replaced === false) {
      replaced = true
      runtime.retry()
    }
  })
  const stop = runtime.connect(execution)
  await waitFor(runtime, 'active')
  assert.equal(acquired, 1)
  hidden = false
  runtime.resume(300_000)
  await waitFor(runtime, 'failed')
  assert.equal(acquired, 2)
  unsubscribe()
  stop()
}

console.log(
  'Passed: connection ownership, replacement, resume admission, and reentrant publication.',
)
