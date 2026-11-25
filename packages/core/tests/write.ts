import assert from 'node:assert/strict'
import { Effect, Fiber } from 'effect'
import { PersistedWriteRejectedError, WriteWaitTimeoutError, WriteHandle } from 'jazz-tools'
import { startTestJazz, testApp } from 'jazz-tools/testing'
import { acquireAdminClient, createTableAccess } from '../src/jazz/client.ts'
import {
  createWrite,
  submitWrite,
  waitForWrite,
  resumeWrite,
  WriteUnavailable,
  WriteRejected,
  createTableWriteCoordinator,
  createTableWriteWorkspace,
  type WriteWorkspaceEvent,
} from '../src/studio/write.ts'

// @lat: [[jazzAccess#Rows and writes]]
// These are coordinator fault-injection doubles, not Jazz durability fixtures.
const owner = {}
let submissions = 0
let waits = 0
const value = { id: 'inserted-row' }
const handle: Pick<WriteHandle<typeof value, typeof value>, 'value' | 'txId' | 'wait'> = {
  value,
  txId: new Promise<never>(() => {}),
  wait: async () => {
    waits += 1
    if (waits === 1) throw new WriteWaitTimeoutError('global', 0)
    return value
  },
}
const operation = createWrite({
  owner,
  submit: () => {
    submissions += 1
    return handle
  },
})
await Effect.runPromise(submitWrite(operation))
const getState = () => operation.state
assert.equal(getState().status, 'awaiting')
assert.equal('handle' in operation.state && operation.state.handle, handle)
await Effect.runPromise(Effect.flip(waitForWrite(operation, owner)))
assert.equal(getState().status, 'unresolved')
await Effect.runPromise(Effect.flip(resumeWrite(operation, {})))
assert.equal(waits, 1, 'another owner must not wait or submit')
assert.equal(await Effect.runPromise(resumeWrite(operation, owner)), value)
assert.equal(getState().status, 'confirmed')
assert.equal(await Effect.runPromise(waitForWrite(operation, owner)), value)
assert.equal(waits, 2, 'confirmation is cached without another native wait')
await Effect.runPromise(Effect.flip(submitWrite(operation)))
assert.equal(submissions, 1, 're-executing submission must not duplicate a write')

let finishWait: (value: void) => void = () => {}
let startedWait: (value: void) => void = () => {}
const started = new Promise<void>((resolve) => {
  startedWait = resolve
})
const pending = new Promise<void>((resolve) => {
  finishWait = resolve
})
const interrupted = createWrite({
  owner,
  submit: () => ({
    value: undefined,
    txId: new Promise<never>(() => {}),
    wait: () => {
      startedWait()
      return pending
    },
  }),
})
await Effect.runPromise(submitWrite(interrupted))
const fiber = Effect.runFork(waitForWrite(interrupted, owner))
const getInterrupted = () => interrupted.state
await started
const concurrent = await Effect.runPromise(Effect.flip(waitForWrite(interrupted, owner)))
assert.ok(concurrent instanceof WriteUnavailable)
assert.equal(getInterrupted().status, 'awaiting', 'a duplicate waiter cannot change the verdict')
await Effect.runPromise(Fiber.interrupt(fiber))
assert.equal(getInterrupted().status, 'unresolved', 'interruption is not rejection')
finishWait()
await Effect.runPromise(resumeWrite(interrupted, owner))
assert.equal(getInterrupted().status, 'confirmed')

let attempts = 0
const failedSubmission = createWrite({
  owner,
  submit: (): typeof handle => {
    attempts += 1
    throw new Error('submission capability failed')
  },
})
await Effect.runPromise(Effect.flip(submitWrite(failedSubmission)))
await Effect.runPromise(Effect.flip(submitWrite(failedSubmission)))
assert.equal(attempts, 1)

// Jazz brands transaction IDs. This value belongs only to the named test double.
const fixtureTransactionId = 'fault-injection-rejected' as ConstructorParameters<
  typeof PersistedWriteRejectedError
>[0]
const nativeRejection = new PersistedWriteRejectedError(fixtureTransactionId, 'denied', 'fixture')
let rejectLate: (cause: unknown) => void = () => {}
let markLateStarted: () => void = () => {}
const lateStarted = new Promise<void>((resolve) => {
  markLateStarted = resolve
})
const latePromise = new Promise<never>((_resolve, reject) => {
  rejectLate = reject
})
const lateRejection = createWrite({
  owner,
  submit: () => ({
    value: undefined,
    txId: Promise.resolve(fixtureTransactionId),
    wait: () => {
      markLateStarted()
      return latePromise
    },
  }),
})
let observedLateVerdict = false
const stopLateObservation = lateRejection.subscribe(() => {
  if (lateRejection.state.status === 'rejected') observedLateVerdict = true
})
await Effect.runPromise(submitWrite(lateRejection))
const lateFiber = Effect.runFork(waitForWrite(lateRejection, owner))
await lateStarted
await Effect.runPromise(Fiber.interrupt(lateFiber))
rejectLate(nativeRejection)
await latePromise.catch(() => {})
assert.equal(
  lateRejection.state.status,
  'rejected',
  'late native rejection survives interrupted observation',
)
assert.equal(observedLateVerdict, true, 'native rejection is observable before Resume')
stopLateObservation()
let rejectedWaits = 0
const rejected = createWrite({
  owner,
  submit: () => ({
    value: undefined,
    txId: Promise.resolve(fixtureTransactionId),
    wait: async () => {
      rejectedWaits += 1
      throw nativeRejection
    },
  }),
})
await Effect.runPromise(submitWrite(rejected))
const rejection = await Effect.runPromise(Effect.flip(waitForWrite(rejected, owner)))
assert.ok(rejection instanceof WriteRejected)
assert.equal(rejection.cause, nativeRejection)
assert.equal(rejected.state.status, 'rejected')
await Effect.runPromise(Effect.flip(resumeWrite(rejected, owner)))
assert.equal(rejectedWaits, 1, 'a native rejection is terminal')

const unknownFailure = createWrite({
  owner,
  submit: () => ({
    value: undefined,
    txId: new Promise<never>(() => {}),
    wait: async () => {
      throw new Error('transport fixture failure')
    },
  }),
})
await Effect.runPromise(submitWrite(unknownFailure))
await Effect.runPromise(Effect.flip(waitForWrite(unknownFailure, owner)))
assert.equal(unknownFailure.state.status, 'unresolved', 'unknown failure is not rejection')

// The observable coordinator owns the original UI promise and same-handle continuation.
let coordinatorSubmissions = 0
let coordinatorWaits = 0
const coordinatorHandle = {
  value,
  txId: new Promise<never>(() => {}),
  wait: async () => {
    coordinatorWaits += 1
    if (coordinatorWaits === 1) throw new WriteWaitTimeoutError('global', 0)
    return value
  },
}
const access = {
  owner,
  readRow: async () => value,
  insert: () => {
    coordinatorSubmissions += 1
    return coordinatorHandle
  },
  update: () => ({ value: undefined, txId: new Promise<never>(() => {}), wait: async () => {} }),
  delete: () => ({ value: undefined, txId: new Promise<never>(() => {}), wait: async () => {} }),
}
const coordinator = createTableWriteCoordinator({ access })
assert.equal(coordinator.getSnapshot(), coordinator.getSnapshot(), 'snapshot identity is stable')
let notifications = 0
let reachedUnresolved: () => void = () => {}
const unresolved = new Promise<void>((resolve) => {
  reachedUnresolved = resolve
})
const unsubscribe = coordinator.subscribe(() => {
  notifications += 1
  if (coordinator.getSnapshot().pendingWrite?.status === 'unresolved') reachedUnresolved()
})
let originalContinuations = 0
const originalPromise = coordinator.insertRow({ title: 'one submission' }).then((id) => {
  originalContinuations += 1
  return id
})
await unresolved
const pendingOperation = coordinator.getSnapshot().operation
const unresolvedSnapshot = coordinator.getSnapshot()
assert.ok(pendingOperation !== null)
assert.equal('handle' in pendingOperation.state && pendingOperation.state.handle, coordinatorHandle)
await assert.rejects(coordinator.insertRow({ title: 'duplicate' }))
assert.equal(originalContinuations, 0, 'unresolved wait must not resolve the original UI promise')
const replacement = createTableWriteCoordinator({ access: { ...access, owner: {} } })
const replacementSnapshot = replacement.getSnapshot()
let replacementNotifications = 0
const stopReplacementObservation = replacement.subscribe(() => {
  replacementNotifications += 1
})
assert.equal(replacement.getSnapshot().pendingWrite, null)
assert.equal(originalContinuations, 0, 'replacement must not settle the old promise')
await Promise.all([coordinator.resumePending(), coordinator.resumePending()])
assert.equal(await originalPromise, value.id)
assert.equal(originalContinuations, 1)
assert.equal(coordinatorSubmissions, 1)
assert.equal(coordinatorWaits, 2, 'concurrent resume cannot create another native wait')
assert.equal(coordinator.getSnapshot().operation, pendingOperation)
assert.equal(coordinator.getSnapshot().state?.status, 'confirmed')
assert.equal(coordinator.getSnapshot().pendingWrite, null)
assert.equal(unresolvedSnapshot.pendingWrite?.status, 'unresolved', 'past snapshots stay unchanged')
assert.equal(
  replacement.getSnapshot(),
  replacementSnapshot,
  'old settlement cannot change the replacement',
)
assert.equal(replacementNotifications, 0)
stopReplacementObservation()
const settledSnapshot = coordinator.getSnapshot()
await coordinator.resumePending()
assert.equal(coordinator.getSnapshot(), settledSnapshot)
unsubscribe()
const notificationsBeforeRead = notifications
assert.equal(await coordinator.readRow(value.id), value)
assert.equal(notifications, notificationsBeforeRead)
await coordinator.insertRow({ title: 'explicit subsequent command' })
assert.equal(notifications, notificationsBeforeRead, 'unsubscribe removes the observer')

const rejectedCoordinator = createTableWriteCoordinator({
  access: {
    ...access,
    insert: () => ({
      value,
      txId: Promise.resolve(fixtureTransactionId),
      wait: async () => {
        throw nativeRejection
      },
    }),
  },
})
const stopThrowingObserver = rejectedCoordinator.subscribe(() => {
  throw new Error('observer fixture')
})
await assert.rejects(
  rejectedCoordinator.insertRow({ title: 'denied' }),
  (error) => error === nativeRejection,
)
assert.equal(rejectedCoordinator.getSnapshot().state?.status, 'rejected')
assert.equal(rejectedCoordinator.getSnapshot().pendingWrite, null)
stopThrowingObserver()
let failedCoordinatorSubmissions = 0
const failedCoordinator = createTableWriteCoordinator({
  access: {
    ...access,
    insert: (): typeof coordinatorHandle => {
      failedCoordinatorSubmissions += 1
      throw new Error('submission fault fixture')
    },
  },
})
await assert.rejects(failedCoordinator.insertRow({ title: 'not submitted' }))
assert.equal(failedCoordinatorSubmissions, 1)
assert.equal(failedCoordinator.getSnapshot().state?.status, 'submission')
assert.equal(failedCoordinator.getSnapshot().pendingWrite, null)

// @lat: [[rowChanges#Persistence outcome]]
const failedRefresh = createTableWriteCoordinator({
  access: {
    ...access,
    readRow: async () => {
      throw new Error('refresh fault fixture')
    },
  },
})
await failedRefresh.insertRow({ title: 'confirmed before refresh' })
const confirmedBeforeRefresh = failedRefresh.getSnapshot()
await assert.rejects(failedRefresh.readRow(value.id))
assert.equal(failedRefresh.getSnapshot(), confirmedBeforeRefresh)
assert.equal(failedRefresh.getSnapshot().state?.status, 'confirmed')
console.log(
  'Passed: coordinator snapshots, original promise, rejection, resume, replacement isolation, and observation cleanup.',
)

// Named ledger port: this verifies workspace command ownership, not React rendering.
const ledgerEvents: WriteWorkspaceEvent[] = []
const workspace = createTableWriteWorkspace<typeof value>({
  onTransition: (event) => {
    ledgerEvents.push(event)
  },
})
const scoped = workspace.table('scope-a')
const initialScoped = scoped.getSnapshot()
assert.equal(scoped.getSnapshot(), initialScoped)
assert.equal(ledgerEvents.length, 0, 'lookup and snapshot reads cannot settle or retire a write')
workspace.attach('scope-a', access)
assert.equal(ledgerEvents.length, 0, 'attaching an idle owner does not issue a ledger transition')
let scopedUnresolved: () => void = () => {}
const scopedStopped = new Promise<void>((resolve) => {
  scopedUnresolved = resolve
})
let scopedWaits = 0
let scopedSubmits = 0
const scopedAccess = {
  ...access,
  owner: {},
  insert: () => {
    scopedSubmits += 1
    return {
      ...coordinatorHandle,
      wait: async () => {
        scopedWaits += 1
        if (scopedWaits === 1) throw new WriteWaitTimeoutError('global', 0)
        return value
      },
    }
  },
}
workspace.attach('scope-a', scopedAccess)
const stopScopedObservation = scoped.subscribe(() => {
  if (scoped.getSnapshot().pendingWrite?.status === 'unresolved') scopedUnresolved()
})
const scopedPromise = scoped.insertRow({ title: 'retained across view detach' })
await scopedStopped
const scopedOperation = scoped.getSnapshot().operation
stopScopedObservation()
assert.equal(workspace.table('scope-a'), scoped)
workspace.attach('scope-a', { ...scopedAccess })
assert.equal(
  scoped.getSnapshot().operation,
  scopedOperation,
  'same owner reattaches the original operation',
)
await scoped.resumePending()
assert.equal(await scopedPromise, value.id)
assert.equal(scopedSubmits, 1)
assert.deepEqual(
  ledgerEvents.map((event) => event.status),
  ['applying', 'confirmed'],
)
assert.equal(ledgerEvents[0]?.operation, ledgerEvents[1]?.operation)
assert.deepEqual(ledgerEvents[1]?.command, {
  kind: 'insert',
  values: { title: 'retained across view detach' },
})
assert.notEqual(scoped.getSnapshot(), initialScoped)

let retireFinish: (result: typeof value) => void = () => {}
let retireStarted: () => void = () => {}
const retireStart = new Promise<void>((resolve) => {
  retireStarted = resolve
})
const retireNative = new Promise<typeof value>((resolve) => {
  retireFinish = resolve
})
const retireOwner = {}
let retiredSubmissions = 0
let retiredWaits = 0
let replacementSubmissions = 0
const retiredHandle = {
  ...coordinatorHandle,
  wait: () => {
    retiredWaits += 1
    retireStarted()
    return retireNative
  },
}
workspace.attach('scope-b', {
  ...access,
  owner: retireOwner,
  insert: () => {
    retiredSubmissions += 1
    return retiredHandle
  },
})
const retiring = workspace.table('scope-b')
const retiringPromise = retiring.insertRow({ title: 'must preserve this intent' })
const retiredFailure = assert.rejects(retiringPromise, (error) => error instanceof WriteUnavailable)
await retireStart
workspace.retireOwner(retireOwner)
workspace.retireOwner(retireOwner)
await retiredFailure
assert.equal(retiring.getSnapshot().retired, true)
assert.equal(retiring.getSnapshot().reloadRequired, true)
assert.equal(retiring.getSnapshot().waiting, false, 'retirement exits active waiting')
assert.equal(retiring.getSnapshot().pendingWrite?.status, 'unresolved')
assert.equal(retiring.getSnapshot().command?.kind, 'insert')
assert.deepEqual(retiring.getSnapshot().command, {
  kind: 'insert',
  values: { title: 'must preserve this intent' },
})
assert.equal(ledgerEvents.filter((event) => event.status === 'retired').length, 1)
await assert.rejects(retiring.resumePending())
await assert.rejects(retiring.insertRow({ title: 'forbidden retry' }))
const retiredSnapshot = retiring.getSnapshot()
const retiredOperation = retiredSnapshot.operation
const retiredCoordinator = ledgerEvents.find((event) => event.scopeKey === 'scope-b')?.coordinator
workspace.attach('scope-b', {
  ...access,
  owner: {},
  insert: () => {
    replacementSubmissions += 1
    return coordinatorHandle
  },
})
assert.equal(workspace.table('scope-b'), retiring, 'unknown retired commands remain blocked')
assert.equal(
  retiring.getSnapshot(),
  retiredSnapshot,
  'replacement attachment cannot replace the snapshot',
)
assert.equal(retiring.getSnapshot().operation, retiredOperation)
await assert.rejects(retiring.insertRow({ title: 'replacement retry forbidden' }))
await assert.rejects(retiring.resumePending())
assert.equal(retiredSubmissions, 1)
assert.equal(retiredWaits, 1)
assert.equal(replacementSubmissions, 0)
retireFinish(value)
await retireNative
await Promise.resolve()
const retiredConfirmed = retiring.getSnapshot()
assert.equal(
  retiredConfirmed.state?.status,
  'confirmed',
  'retirement must retain late native confirmation',
)
assert.equal(retiredConfirmed.retired, true)
assert.equal(retiredConfirmed.reloadRequired, true)
assert.equal(retiredConfirmed.pendingWrite, null)
assert.equal(retiredConfirmed.operation, retiredOperation)
assert.equal(
  retiredConfirmed.state !== null &&
    'handle' in retiredConfirmed.state &&
    retiredConfirmed.state.handle,
  retiredHandle,
)
assert.match(retiredConfirmed.retirementMessage ?? '', /confirmed.*reload/i)
const confirmedRetiredEvent = ledgerEvents.find(
  (event) => event.scopeKey === 'scope-b' && event.status === 'confirmed',
)
assert.equal(confirmedRetiredEvent?.operation, retiredOperation)
assert.equal(confirmedRetiredEvent?.coordinator, retiredCoordinator)
workspace.attach('scope-b', { ...access, owner: {} })
assert.equal(retiring.getSnapshot(), retiredConfirmed)
await assert.rejects(retiring.insertRow({ title: 'retry after confirmation forbidden' }))
await assert.rejects(retiring.resumePending())
assert.equal(retiredSubmissions, 1)
assert.equal(retiredWaits, 1)
assert.equal(replacementSubmissions, 0)

let rejectRetiredNative: (cause: unknown) => void = () => {}
let signalRejectedStart: () => void = () => {}
const rejectedStart = new Promise<void>((resolve) => {
  signalRejectedStart = resolve
})
const retiredRejectPromise = new Promise<never>((_resolve, reject) => {
  rejectRetiredNative = reject
})
const rejectedOwner = {}
let retiredRejectedSubmissions = 0
let retiredRejectedWaits = 0
let rejectedReplacementSubmissions = 0
const retiredRejectedHandle = {
  ...coordinatorHandle,
  wait: () => {
    retiredRejectedWaits += 1
    signalRejectedStart()
    return retiredRejectPromise
  },
}
workspace.attach('retired-rejection', {
  ...access,
  owner: rejectedOwner,
  insert: () => {
    retiredRejectedSubmissions += 1
    return retiredRejectedHandle
  },
})
const retiredRejectedTable = workspace.table('retired-rejection')
const retiredRejectedOriginal = retiredRejectedTable.insertRow({
  title: 'retired rejection intent',
})
const rejectionRetiredFailure = assert.rejects(
  retiredRejectedOriginal,
  (error) => error instanceof WriteUnavailable,
)
await rejectedStart
workspace.retireOwner(rejectedOwner)
await rejectionRetiredFailure
const retiredBeforeRejection = retiredRejectedTable.getSnapshot()
workspace.attach('retired-rejection', {
  ...access,
  owner: {},
  insert: () => {
    rejectedReplacementSubmissions += 1
    return coordinatorHandle
  },
})
assert.equal(retiredRejectedTable.getSnapshot(), retiredBeforeRejection)
await assert.rejects(retiredRejectedTable.insertRow({ title: 'duplicate denied' }))
await assert.rejects(retiredRejectedTable.resumePending())
rejectRetiredNative(nativeRejection)
await retiredRejectPromise.catch(() => {})
await Promise.resolve()
const retiredRejectedSnapshot = retiredRejectedTable.getSnapshot()
assert.equal(
  retiredRejectedSnapshot.state?.status,
  'rejected',
  'retirement must retain late native rejection',
)
assert.ok(retiredRejectedSnapshot.state?.status === 'rejected')
assert.equal(retiredRejectedSnapshot.state.error.cause, nativeRejection)
assert.equal(retiredRejectedSnapshot.state.handle, retiredRejectedHandle)
assert.equal(retiredRejectedSnapshot.operation, retiredBeforeRejection.operation)
assert.equal(retiredRejectedSnapshot.reloadRequired, true)
assert.equal(retiredRejectedSnapshot.retired, true)
assert.match(retiredRejectedSnapshot.retirementMessage ?? '', /rejected.*reload/i)
assert.equal(
  ledgerEvents.filter(
    (event) => event.scopeKey === 'retired-rejection' && event.status === 'rejected',
  ).length,
  1,
)
workspace.attach('retired-rejection', { ...access, owner: {} })
assert.equal(retiredRejectedTable.getSnapshot(), retiredRejectedSnapshot)
await assert.rejects(retiredRejectedTable.insertRow({ title: 'retry after rejection denied' }))
await assert.rejects(retiredRejectedTable.resumePending())
assert.equal(retiredRejectedSubmissions, 1)
assert.equal(retiredRejectedWaits, 1)
assert.equal(rejectedReplacementSubmissions, 0)
workspace.dispose()
workspace.dispose()

console.log(
  'Passed: workspace remount, late native verdicts after retirement, blocked replacement/retry/resume, and idempotent cleanup.',
)

async function bounded<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Probe did not settle: ${label}`)), 8000)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

// Real local Jazz in memory. No external service or disk/restart durability claim.
const app = testApp({ tables: { records: { columns: { title: 'string' } } } })
const server = await startTestJazz({
  app,
  permissions: {
    format: 1,
    tables: { records: { read: 'true', insert: 'false', update: 'false', delete: 'false' } },
  },
  coreOptions: { host: '127.0.0.1', inMemory: true, enableLogs: false },
})
try {
  await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const client = yield* acquireAdminClient({
          appId: server.core.appId,
          serverUrl: server.core.url,
          adminSecret: server.core.adminSecret,
        })
        const tableAccess = createTableAccess({
          client,
          tableName: 'records',
          schema: app.records._schema,
        })
        let originalNativeHandle: ReturnType<typeof tableAccess.insert> | undefined
        const writes = createTableWriteCoordinator({
          access: {
            ...tableAccess,
            insert: (values) => {
              originalNativeHandle = tableAccess.insert(values)
              return originalNativeHandle
            },
          },
          waitOptions: { timeoutMs: 5000 },
        })
        yield* Effect.tryPromise(async () => {
          const id = await bounded(
            writes.insertRow({ title: 'coordinator-native-insert' }),
            'insert',
          )
          const inserted = writes.getSnapshot()
          assert.equal(inserted.state?.status, 'confirmed')
          assert.ok(inserted.state !== null && 'handle' in inserted.state)
          assert.ok(inserted.state.handle instanceof WriteHandle)
          assert.equal(inserted.state.handle, originalNativeHandle)
          assert.equal(inserted.state.handle.txId, originalNativeHandle?.txId)
          assert.equal(inserted.operation?.owner, client)
          assert.equal(originalNativeHandle?.value.id, id)
          assert.equal(
            (await bounded(writes.readRow(id), 'read inserted row'))?.title,
            'coordinator-native-insert',
          )
          const rows = await client.db.all(app.records, { tier: 'remote' })
          assert.equal(rows.filter((row) => row.id === id).length, 1)
          await bounded(writes.updateRow(id, { title: 'coordinator-native-update' }), 'update')
          assert.equal(writes.getSnapshot().state?.status, 'confirmed')
          assert.equal(
            (await bounded(writes.readRow(id), 'read updated row'))?.title,
            'coordinator-native-update',
          )
          await bounded(writes.deleteRow(id), 'delete')
          assert.equal(writes.getSnapshot().state?.status, 'confirmed')
          assert.equal(await bounded(writes.readRow(id), 'read deleted row'), null)
        })
      }),
    ),
  )
} finally {
  await server.stop()
}
console.log(
  'Passed: real local Jazz privileged dynamic adapter and coordinator insert/update/delete/global waits/remote reads; scoped client and server cleanup.',
)
console.log('Not checked: disk/restart persistence, external services, reload, or React rendering.')
