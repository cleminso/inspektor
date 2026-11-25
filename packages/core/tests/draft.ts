import assert from 'node:assert/strict'
import type { ColumnDescriptor, ColumnType } from 'jazz-tools'
import {
  changeFieldMode,
  duplicateDraft,
  editField,
  fieldIntent,
  fieldReadOnlyReason,
  formatColumnDefault,
  formatFieldValue,
  insertDraft,
  parseFieldText,
  projectDraft,
  rebaseDraft,
  resolveField,
  revertField,
  revertUpdateField,
  setIntentMode,
  setIntentText,
  submitDraft,
  updateDraft,
  valuesEqual,
} from '../src/studio/draft.ts'
import type { FieldIntent, RowDraft } from '../src/studio/draft.ts'

const column = (name: string, type: ColumnType, nullable = false): ColumnDescriptor => ({
  name,
  column_type: type,
  nullable,
})
const text = column('text', { type: 'Text' })
const count = column('count', { type: 'Integer' })
const optional = column('optional', { type: 'Text' }, true)
const defaulted: ColumnDescriptor = {
  ...column('defaulted', { type: 'Integer' }),
  default: { type: 'Integer', value: 8 },
}
const json = column('json', { type: 'Json' }, true)
const array = column('array', { type: 'Array', element: { type: 'Integer' } })
const row = column('row', {
  type: 'Row',
  columns: [column('name', { type: 'Text' }), column('note', { type: 'Text' }, true)],
})
const columns = [text, count, optional, defaulted, json, array, row]

function edit(draft: RowDraft, descriptor: ColumnDescriptor, intent: FieldIntent): RowDraft {
  const result = editField(draft, descriptor, intent)
  assert.equal(result.kind, 'changed')
  return result.draft
}

function ready(draft: RowDraft, descriptors: readonly ColumnDescriptor[] = columns) {
  const result = submitDraft(draft, descriptors)
  assert.equal(result.kind, 'ready')
  return result
}

function valid(descriptor: ColumnDescriptor, raw: string, expected: unknown) {
  const result = resolveField(updateDraft({}), descriptor, { mode: 'value', text: raw })
  assert.equal(result.kind, 'valid', raw)
  if (result.kind === 'valid') assert.deepEqual(result.value, expected)
}

function invalid(descriptor: ColumnDescriptor, raw: string) {
  const draft = edit(updateDraft({}), descriptor, { mode: 'value', text: raw })
  const result = resolveField(draft, descriptor)
  assert.equal(result.kind, 'invalid', raw)
  if (result.kind === 'invalid') assert.equal(result.text, raw)
  const submission = submitDraft(draft, [descriptor])
  assert.equal(submission.kind, 'invalid')
  assert.equal('payload' in submission, false)
}

// @lat: [[rowChanges#Field intent]] — omission, SQL NULL, empty, and invalid text differ.
const initial = insertDraft(columns)
assert.equal(fieldIntent(initial, defaulted).mode, 'omitted')
assert.equal(fieldIntent(initial, optional).mode, 'null')
assert.equal(fieldIntent(initial, text).text, '')
assert.equal(submitDraft(initial, columns).kind, 'invalid')
const insert = insertDraft(columns, {
  text: '',
  count: 0,
  json: null,
  array: [],
  row: { name: '' },
})
assert.deepEqual(ready(insert).payload, {
  text: '',
  count: 0,
  optional: null,
  json: null,
  array: [],
  row: { name: '', note: null },
})
assert.equal(fieldIntent(insertDraft([defaulted], { defaulted: null }), defaulted).mode, 'null')
assert.equal(
  submitDraft(insertDraft([defaulted], { defaulted: null }), [defaulted]).kind,
  'invalid',
)
assert.equal(
  resolveField(updateDraft({}), defaulted, { mode: 'omitted', text: '' }).kind,
  'invalid',
)
assert.equal(resolveField(updateDraft({}), count, { mode: 'null', text: '' }).kind, 'invalid')

// @lat: [[rowChanges#Value constraints]] — validate UI input; Jazz still decides acceptance.
valid(count, '-2147483648', -2147483648)
valid(count, '2147483647', 2147483647)
for (const raw of ['', ' ', '2147483648', '-2147483649', '0.1', 'NaN', 'Infinity'])
  invalid(count, raw)
const big = column('big', { type: 'BigInt' })
valid(big, String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER)
for (const raw of ['', ' ', '9007199254740992', '-9007199254740992', '1.5']) invalid(big, raw)
const double = column('double', { type: 'Double' })
valid(double, '1.25', 1.25)
for (const raw of ['', 'Infinity', 'NaN']) invalid(double, raw)
const boolean = column('boolean', { type: 'Boolean' })
valid(boolean, ' TRUE ', true)
valid(boolean, '0', false)
invalid(boolean, 'yes')
const enumeration = column('enum', { type: 'Enum', variants: ['', 'one'] })
valid(enumeration, '', '')
invalid(enumeration, ' one ')
const uuid = column('uuid', { type: 'Uuid' })
valid(uuid, '01234567-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcdef')
valid(uuid, '0123456789abcdef0123456789abcdef', '0123456789abcdef0123456789abcdef')
invalid(uuid, '0-123456789abcdef0123456789abcdef')
const time = column('time', { type: 'Timestamp' })
valid(time, '1970-01-01T00:00:00.000Z', 0)
valid(time, '100', 100)
invalid(time, 'not a date')
invalid(json, 'null')
invalid(json, '{')
invalid(json, '1e400')
invalid(json, '{"nested":[1e400]}')
valid(json, '""', '')
valid(json, 'false', false)
valid(array, '[]', [])
invalid(array, '[null]')
invalid(array, '[2147483648]')
valid(row, '{"name":"Ada"}', { name: 'Ada', note: null })
valid(row, '["Ada",null]', { name: 'Ada', note: null })
for (const raw of ['[]', '["Ada"]', '{}', '{"name":"Ada","extra":1}', 'null', '["Ada",null,0]'])
  invalid(row, raw)
const nested = column('nested', {
  type: 'Array',
  element: {
    type: 'Row',
    columns: [column('data', { type: 'Json' }), column('n', { type: 'Integer' }, true)],
  },
})
valid(nested, '[[{"ok":true},null]]', [{ data: { ok: true }, n: null }])
invalid(nested, '[[null,null]]')
const nestedDraft = edit(updateDraft({}), nested, { mode: 'value', text: '[[{"ok":true},null]]' })
assert.deepEqual(ready(nestedDraft, [nested]).payload, {
  nested: [{ data: '{"ok":true}', n: null }],
})
const stringJson = edit(updateDraft({}), json, { mode: 'value', text: '"hello"' })
assert.equal(ready(stringJson, [json]).values.json, 'hello')
assert.equal(ready(stringJson, [json]).payload.json, '"hello"')

// @lat: [[rowChanges#Draft reconciliation]] — live rows replace source, never dirty raw input.
const source = { text: 'old', count: 1, optional: null }
const untouched = updateDraft(source)
assert.deepEqual(ready(untouched).payload, {})
let draft = edit(untouched, count, { mode: 'value', text: ' 2 ' })
draft = edit(draft, text, { mode: 'value', text: 'changed' })
const rebased = rebaseDraft(draft, { text: 'remote', count: 3, optional: 'remote' }, columns)
assert.equal(fieldIntent(rebased, count).text, ' 2 ')
assert.equal(fieldIntent(rebased, optional).text, 'remote')
assert.deepEqual(ready(rebased).payload, { text: 'changed', count: 2 })
assert.deepEqual(ready(rebaseDraft(rebased, { text: 'changed', count: 2 }, columns)).payload, {})
const bad = edit(draft, count, { mode: 'value', text: 'unfinished-' })
assert.equal(fieldIntent(rebaseDraft(bad, { count: 2 }, columns), count).text, 'unfinished-')
const switched = changeFieldMode(bad, count, 'null')
assert.equal(switched.kind, 'changed')
if (switched.kind === 'changed')
  assert.equal(fieldIntent(switched.draft, count).text, 'unfinished-')
assert.deepEqual(ready(revertField(bad, count)).payload, { text: 'changed' })
const raw = '{ "a": [1, 2] }'
const structured = edit(updateDraft({ json: {} }), json, { mode: 'value', text: raw })
assert.equal(
  fieldIntent(rebaseDraft(structured, { json: { other: true } }, [json]), json).text,
  raw,
)
assert.deepEqual(
  ready(rebaseDraft(structured, { json: { a: [1, 2] } }, [json]), [json]).payload,
  {},
)
assert.equal(valuesEqual(row.column_type, ['Ada', null], { name: 'Ada', note: null }), true)
assert.equal(valuesEqual(time.column_type, new Date(0), '1970-01-01T00:00:00.000Z'), true)
assert.equal(valuesEqual(big.column_type, 1n, 1), true)
assert.deepEqual(source, { text: 'old', count: 1, optional: null })
assert.equal(submitDraft(draft, [count]).kind, 'invalid') // Removed dirty fields must not disappear silently.

// @lat: [[rowChanges#Value constraints]], [[changeRow#Insert or duplicate]] — no text encoding guesses.
const binary = column('bytes', { type: 'Bytea' })
const nestedBinary = column('nestedBytes', {
  type: 'Array',
  element: { type: 'Row', columns: [binary] },
})
const provenance = column('$updatedAt', { type: 'Timestamp' })
for (const descriptor of [binary, nestedBinary, provenance, column('id', { type: 'Uuid' })]) {
  assert.notEqual(fieldReadOnlyReason(descriptor), null)
  assert.equal(editField(updateDraft({}), descriptor, { mode: 'null', text: '' }).kind, 'rejected')
}
assert.equal(submitDraft(insertDraft([binary]), [binary]).kind, 'invalid')
assert.deepEqual(
  ready(insertDraft([{ ...binary, nullable: true }]), [{ ...binary, nullable: true }]).payload,
  { bytes: null },
)
const duplication = duplicateDraft([text, provenance], { text: 'copied', $updatedAt: 123 })
assert.deepEqual(ready(duplication, [text, provenance]).payload, { text: 'copied' })
assert.deepEqual(duplication.sourceValues, { text: 'copied' })
assert.equal(
  Object.hasOwn(duplicateDraft([text], { id: 'old', text: 'copy' }).sourceValues, 'id'),
  false,
)
assert.deepEqual(ready(updateDraft({ bytes: new Uint8Array([1]) }), [binary]).payload, {})
const bytes = new Uint8Array([0, 255])
assert.deepEqual(ready(duplicateDraft([binary], { bytes }), [binary]).payload, { bytes })
const defaultBinary: ColumnDescriptor = {
  ...binary,
  default: { type: 'Bytea', value: new Uint8Array([7]) },
}
assert.equal(fieldIntent(insertDraft([defaultBinary]), defaultBinary).mode, 'omitted')
assert.deepEqual(ready(insertDraft([defaultBinary]), [defaultBinary]).payload, {})
assert.deepEqual(ready(duplicateDraft([defaultBinary], { bytes }), [defaultBinary]).payload, {
  bytes,
})
assert.deepEqual(
  ready(duplicateDraft([nestedBinary], { nestedBytes: [[bytes]] }), [nestedBinary]).payload,
  { nestedBytes: [{ bytes }] },
)
assert.equal(submitDraft(insertDraft([binary], { bytes: null }), [binary]).kind, 'invalid')
const unusual = column('__proto__', { type: 'Text' })
const unusualDraft = edit(updateDraft({}), unusual, { mode: 'value', text: 'kept' })
assert.equal(Object.hasOwn(ready(unusualDraft, [unusual]).payload, '__proto__'), true)
assert.deepEqual(fieldIntent(updateDraft({}), unusual), { mode: 'value', text: '' })
const inherited = column('constructor', { type: 'Text' })
assert.deepEqual(fieldIntent(updateDraft({}), inherited), { mode: 'value', text: '' })
const nestedBig = column('nestedBig', { type: 'Array', element: { type: 'BigInt' } })
assert.deepEqual(ready(duplicateDraft([nestedBig], { nestedBig: [1n] }), [nestedBig]).payload, {
  nestedBig: [1],
})
assert.equal(
  submitDraft(duplicateDraft([nestedBig], { nestedBig: [9007199254740992n] }), [nestedBig]).kind,
  'invalid',
)

// Studio compatibility: preserve field names, source identity, previews, and partial presentation.
assert.equal(initial.fieldInputs.defaulted?.mode, 'omitted')
assert.equal(initial.fieldInputs.defaulted?.text, '8')
assert.equal(untouched.sourceValues, source)
assert.equal(rebaseDraft(untouched, { ...source }, columns), untouched)
assert.equal(revertUpdateField(untouched, 'missing'), untouched)
assert.equal(revertUpdateField(initial, 'count'), initial)
const partial = projectDraft(bad, columns)
assert.deepEqual(partial.displayValues, { text: 'changed' })
assert.deepEqual(partial.submissionValues, { text: 'changed' })
assert.equal(typeof partial.errors.count, 'string')
assert.equal('payload' in submitDraft(bad, columns), false)
assert.deepEqual(setIntentMode({ mode: 'null', text: '' }, json, 'value'), {
  mode: 'value',
  text: '{}',
})
assert.deepEqual(setIntentMode({ mode: 'omitted', text: '' }, array, 'value'), {
  mode: 'value',
  text: '[]',
})
assert.equal(setIntentMode({ mode: 'null', text: raw }, json, 'value').text, raw)
const nullInput = { mode: 'null', text: raw } as const
assert.equal(setIntentText(nullInput, 'replacement'), nullInput)
assert.equal(formatColumnDefault(defaulted), '8')
assert.equal(formatFieldValue(bytes, binary.column_type), '(2 bytes)')
assert.equal(parseFieldText(count.column_type, '42'), 42)
assert.equal(valuesEqual(big.column_type, 9007199254740992n, '9007199254740992'), true)
assert.equal(valuesEqual(binary.column_type, bytes, new Uint8Array([0, 255])), true)
assert.equal(
  valuesEqual({ type: 'Array', element: binary.column_type }, [bytes], [new Uint8Array([0, 255])]),
  true,
)
assert.equal(resolveField(insertDraft([binary]), binary).kind, 'invalid')
assert.equal(
  resolveField(insertDraft([{ ...binary, nullable: true }]), { ...binary, nullable: true }).kind,
  'valid',
)
assert.equal(
  resolveField(updateDraft({}), { ...enumeration, nullable: true }, { mode: 'value', text: '' })
    .kind,
  'invalid',
)
// Preserve the established JSON boundary representation, including nullable nested Json members.
const nullableJsonRow = column('jsonRow', {
  type: 'Row',
  columns: [column('value', { type: 'Json' }, true)],
})
const nullableJsonDraft = edit(updateDraft({}), nullableJsonRow, { mode: 'value', text: '{}' })
assert.deepEqual(ready(nullableJsonDraft, [nullableJsonRow]).values, { jsonRow: { value: null } })
assert.deepEqual(ready(nullableJsonDraft, [nullableJsonRow]).payload, {
  jsonRow: { value: 'null' },
})

console.log('draft probe passed')
