import assert from 'node:assert/strict'

import { Effect } from 'effect'
import { startTestJazz, testApp } from 'jazz-tools/testing'

import { acquireAdminClient, createTableAccess } from '../src/jazz/client.ts'
import { editField, insertDraft, submitDraft, updateDraft } from '../src/studio/draft.ts'

// Fixture syntax follows Jazz tests/typed-app/apps/every-kind/jazz.app.json:
// json, optional JSON, array/string, nested array/float, and defaultedFloat.
// This proves local real Jazz in-memory results, not disk/restart persistence.
const app = testApp({
  tables: {
    records: {
      columns: {
        data: { json: true },
        maybeData: { json: true, optional: true },
        tags: { array: 'string' },
        nested: { array: { array: 'float' } },
        defaultedFloat: { type: 'float', default: 1.5 },
      },
    },
  },
})
const permissions = {
  format: 1,
  tables: { records: { read: 'true', insert: 'true', update: 'true', delete: 'true' } },
}
const failures: unknown[] = []
const server = await startTestJazz({
  app,
  permissions,
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
        const schema = app.records._schema
        const columns = schema.records?.columns
        assert.ok(columns !== undefined)
        const access = createTableAccess({ client, schema, tableName: 'records' })
        // @lat: [[rowChanges#Value constraints]]
        // @lat: [[rowChanges#Field intent]]
        // @lat: [[rowChanges#Persistence outcome]]
        yield* Effect.tryPromise(async (signal) => {
          const documents = [
            { message: 'quoted "text"', members: [1, true, null, { key: 'value' }] },
            ['array root', { nested: false }],
            'JSON string root',
            false,
            42,
          ]
          for (const data of documents) {
            signal.throwIfAborted()
            const nested = [[1.5, -2], [], [0]]
            const draft = insertDraft(columns, { data, tags: ['alpha', 'beta'], nested })
            const submission = submitDraft(draft, columns)
            assert.equal(submission.kind, 'ready')
            assert.ok(submission.kind === 'ready')
            assert.deepEqual(submission.values.data, data)
            assert.equal(Object.hasOwn(submission.payload, 'defaultedFloat'), false)
            assert.equal(submission.payload.maybeData, null)
            const write = access.insert(submission.payload)
            await write.wait({ tier: 'global', timeoutMs: 5000 })
            const row = await access.readRow(write.value.id)
            signal.throwIfAborted()
            assert.ok(row !== null)
            assert.deepEqual(row.data, data, 'Root JSON must roundtrip without double encoding')
            assert.deepEqual(row.tags, ['alpha', 'beta'])
            assert.deepEqual(row.nested, nested)
            assert.equal(row.maybeData, null, 'Explicit SQL NULL must remain NULL')
            assert.equal(row.defaultedFloat, 1.5, 'Jazz must apply the omitted stored default')

            // Sparse update must preserve untouched values while persisting empty collections.
            const dataColumn = columns.find((column) => column.name === 'data')
            const tagsColumn = columns.find((column) => column.name === 'tags')
            assert.ok(dataColumn !== undefined && tagsColumn !== undefined)
            const changedData = { changed: true, original: data }
            const dataEdit = editField(updateDraft(row), dataColumn, {
              mode: 'value',
              text: JSON.stringify(changedData),
            })
            assert.ok(dataEdit.kind === 'changed')
            const tagsEdit = editField(dataEdit.draft, tagsColumn, { mode: 'value', text: '[]' })
            assert.ok(tagsEdit.kind === 'changed')
            const update = submitDraft(tagsEdit.draft, columns)
            assert.ok(update.kind === 'ready')
            assert.deepEqual(Object.keys(update.payload).sort(), ['data', 'tags'])
            await access.update(row.id, update.payload).wait({ tier: 'global', timeoutMs: 5000 })
            const updated = await access.readRow(row.id)
            assert.ok(updated !== null)
            assert.deepEqual(updated.data, changedData)
            assert.deepEqual(updated.tags, [])
            assert.deepEqual(updated.nested, nested)
            assert.equal(updated.maybeData, null)
            assert.equal(updated.defaultedFloat, 1.5)
          }
        }).pipe(Effect.timeout('20 seconds'))
      }),
    ),
  )
  console.log(
    'Passed: local real Jazz in-memory draft JSON object/array/string/boolean/number roundtrips.',
  )
  console.log(
    'Passed: structured arrays, SQL NULL, omitted Jazz default, sparse update, and empty array persistence.',
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
  throw new AggregateError(failures, 'Local real Jazz in-memory draft probe failed')
console.log('Passed: scoped client and server cleanup.')
console.log(
  'Not checked: Row columns, nested JSON column codecs, disk/restart persistence, or external services.',
)
