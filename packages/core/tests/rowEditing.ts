import assert from 'node:assert/strict'
import type { ColumnDescriptor } from 'jazz-tools'
import { createRowEditingWorkspace } from '../src/workbench/rowEditing.ts'
import type { TableWriteAccess, WriteCapability } from '../src/studio/write.ts'

type Row = { id: string; text: string; count: number }
const columns: readonly ColumnDescriptor[] = [
  { name: 'id', column_type: { type: 'Text' }, nullable: false },
  { name: 'text', column_type: { type: 'Text' }, nullable: false },
  { name: 'count', column_type: { type: 'Integer' }, nullable: false },
]
const source: Row = { id: 'row', text: 'source', count: 1 }
const intent = (text: string) => ({ mode: 'value' as const, text })
function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  let reject: (error: unknown) => void = () => {}
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function handle<T>(value: T, wait: () => Promise<T> = async () => value): WriteCapability<T, T> {
  return { value, txId: new Promise<never>(() => {}), wait }
}
function fixture() {
  const patches: Record<string, unknown>[] = []
  let read: () => Promise<Row | null> = async () => source
  let wait: () => Promise<void> = async () => {}
  const owner = {}
  const access: TableWriteAccess<Row> = {
    owner,
    readRow: () => read(),
    update: (_id, patch) => {
      patches.push(patch)
      return handle(undefined, () => wait())
    },
    insert: () => handle(source),
    delete: () => handle(undefined, () => wait()),
  }
  const workspace = createRowEditingWorkspace<Row>()
  const table = workspace.table('scope')
  workspace.attach('scope', access)
  return {
    workspace,
    table,
    owner,
    access,
    patches: () => patches,
    setRead: (next: typeof read) => {
      read = next
    },
    setWait: (next: typeof wait) => {
      wait = next
    },
  }
}

// Raw invalid intent is pending, but cannot become a partial native patch.
{
  const f = fixture()
  assert.equal(f.workspace.table('scope'), f.table)
  assert.equal(f.table.getSnapshot(), f.table.getSnapshot())
  f.table.setFieldInput('row', source, columns, 'text', intent('valid change'))
  f.table.setFieldInput('row', source, columns, 'count', intent('unfinished'))
  assert.equal(f.table.getSnapshot().draftCount, 1)
  assert.equal(f.workspace.hasPendingChanges(), true)
  assert.equal(f.table.editor('row', source, columns).fieldInputs.count?.text, 'unfinished')
  assert.deepEqual(await f.table.saveRow('row', columns), {
    status: 'invalid',
    errors: { count: 'Expected a signed 32-bit integer.' },
  })
  assert.equal(f.patches().length, 0)
  assert.equal(f.table.getSnapshot().draftCount, 1)
  assert.equal(f.table.discardAll(), true)
  assert.equal(f.table.discardAll(), true)
  f.table.setFieldInput('row', source, columns, 'text', intent('discard on delete'))
  await f.table.deleteRow('row')
  assert.equal(f.table.getSnapshot().draftCount, 0)
  f.workspace.retireOwner(f.owner)
  assert.equal(f.workspace.hasPendingChanges(), false)
  assert.equal(f.table.discardAll(), true)
  f.workspace.dispose()
}

// Save locks admission synchronously, including the post-confirmation remote read.
{
  const f = fixture()
  const verdict = deferred<void>()
  const refresh = deferred<Row | null>()
  f.setWait(() => verdict.promise)
  f.setRead(() => refresh.promise)
  f.table.setFieldInput('row', source, columns, 'text', intent('saved'))
  const saving = f.table.saveRow('row', columns)
  assert.equal(f.table.getSnapshot().busy, true)
  await assert.rejects(f.table.saveRow('row', columns))
  await assert.rejects(f.table.insertRow({ text: 'blocked' }))
  await assert.rejects(f.table.loadDuplicate('row', columns))
  verdict.resolve()
  // Use observable state rather than sleeps.
  if (f.table.getSnapshot().pendingWrite !== null) {
    await new Promise<void>((resolve) => {
      const release = f.table.subscribe(() => {
        if (f.table.getSnapshot().pendingWrite === null) {
          release()
          resolve()
        }
      })
    })
  }
  assert.equal(f.table.getSnapshot().busy, true)
  assert.equal(f.workspace.hasPendingChanges(), true)
  assert.equal(f.table.discardAll(), false)
  await assert.rejects(f.table.deleteRow('row'))
  refresh.resolve({ ...source, text: 'saved' })
  const outcome = await saving
  assert.deepEqual(outcome, {
    status: 'saved',
    row: { ...source, text: 'saved' },
    fields: new Set(['text']),
  })
  assert.deepEqual(f.patches(), [{ text: 'saved' }])
  assert.equal(f.table.getSnapshot().draftCount, 0)
  assert.equal(f.table.getSnapshot().busy, false)
  f.workspace.dispose()
}

// Confirmation clears the submitted identity, never a replacement draft.
{
  const f = fixture()
  const verdict = deferred<void>()
  f.setWait(() => verdict.promise)
  f.table.setFieldInput('row', source, columns, 'text', intent('first'))
  const saving = f.table.saveRow('row', columns)
  f.table.setFieldInput('row', source, columns, 'text', intent('replacement'))
  verdict.resolve()
  await saving
  assert.equal(f.table.editor('row', source, columns).fieldInputs.text?.text, 'replacement')
  assert.equal(f.table.getSnapshot().draftCount, 1)
  f.workspace.dispose()
}

// Confirmed writes with failed refresh cannot be offered as retryable mutations.
{
  const f = fixture()
  const refreshError = new Error('refresh unavailable')
  f.setRead(async () => {
    throw refreshError
  })
  f.table.setFieldInput('row', source, columns, 'text', intent('saved'))
  const outcome = await f.table.saveRow('row', columns)
  assert.deepEqual(outcome, {
    status: 'savedRefreshFailed',
    error: refreshError,
    fields: new Set(['text']),
  })
  assert.equal(f.table.getSnapshot().draftCount, 0)
  assert.deepEqual(await f.table.saveRow('row', columns), { status: 'unchanged' })
  assert.equal(f.patches().length, 1)
  f.workspace.dispose()
}

// Submission failure retains intent and ignores local failed-write echoes.
{
  const f = fixture()
  f.workspace.attach('scope', {
    ...f.access,
    owner: {},
    update: () => {
      throw new Error('submission failed')
    },
  })
  f.table.setFieldInput('row', source, columns, 'text', intent('pending'))
  await assert.rejects(f.table.saveRow('row', columns))
  assert.equal(f.table.getSnapshot().execution.status, 'failed')
  f.table.rebaseRows([{ ...source, text: 'pending' }], columns)
  assert.equal(f.table.getSnapshot().draftCount, 1)
  const duplicate = await f.table.loadDuplicate('row', columns)
  assert.deepEqual(duplicate, { text: 'pending', count: 1 })
  assert.equal(f.table.getSnapshot().execution.status, 'failed')
  assert.equal(f.table.discardAll(), true)
  assert.equal(f.table.getSnapshot().execution.status, 'idle')
  f.workspace.dispose()
}

// Duplicate reads lock writes, use valid semantic overlays, and omit automatic fields.
{
  const f = fixture()
  const read = deferred<Row | null>()
  f.setRead(() => read.promise)
  f.table.setFieldInput('row', source, columns, 'count', intent('invalid'))
  f.table.setFieldInput('row', source, columns, 'text', intent('overlay'))
  const duplicating = f.table.loadDuplicate('row', columns)
  await assert.rejects(f.table.deleteRow('row'))
  await assert.rejects(f.table.saveRow('row', columns))
  read.resolve(source)
  assert.deepEqual(await duplicating, { text: 'overlay', count: 1 })
  assert.equal(f.table.getSnapshot().draftCount, 1)
  f.workspace.retireOwner(f.owner)
  assert.equal(f.table.discardAll(), true)
  assert.equal(f.workspace.hasPendingChanges(), false)
  f.workspace.dispose()
}

// Retirement keeps the lock and publishes a late native verdict.
{
  const f = fixture()
  const started = deferred<void>()
  const verdict = deferred<void>()
  f.setWait(() => {
    started.resolve()
    return verdict.promise
  })
  f.table.setFieldInput('row', source, columns, 'text', intent('saved'))
  const saving = f.table.saveRow('row', columns)
  await started.promise
  f.workspace.retireOwner(f.owner)
  await assert.rejects(saving)
  assert.equal(f.table.getSnapshot().retired, true)
  assert.equal(f.table.getSnapshot().reloadRequired, true)
  f.workspace.attach('scope', { ...f.access, owner: {} })
  await assert.rejects(f.table.saveRow('row', columns))
  verdict.resolve()
  if (f.table.getSnapshot().retirementMessage?.includes('confirmed') !== true) {
    await new Promise<void>((resolve) => {
      const release = f.table.subscribe(() => {
        if (f.table.getSnapshot().retirementMessage?.includes('confirmed') === true) {
          release()
          resolve()
        }
      })
    })
  }
  assert.equal(f.table.getSnapshot().draftCount, 0)
  assert.equal(f.workspace.hasPendingChanges(), true)
  assert.equal(f.table.discardAll(), false)
  f.workspace.dispose()
}

console.log('row editing checks passed')
