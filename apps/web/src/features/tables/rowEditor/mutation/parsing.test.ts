import { describe, expect, it } from 'vitest'
import type { ColumnType } from 'jazz-tools'

import {
  formatMutationFieldValue,
  parseMutationFieldValue,
} from '@tables/rowEditor/mutation/parsing'

describe('formatMutationFieldValue', () => {
  it.each([
    [{ type: 'Json' }, { enabled: true }, ['{', '  "enabled": true', '}'].join('\n')],
    [
      { type: 'Array', element: { type: 'Text' } },
      ['one', 'two'],
      ['[', '  "one",', '  "two"', ']'].join('\n'),
    ],
    [{ type: 'Row', columns: [] }, { name: 'Ada' }, ['{', '  "name": "Ada"', '}'].join('\n')],
  ] satisfies [ColumnType, unknown, string][])(
    'pretty-serializes a runtime $0.type value',
    (type, value, expected) => {
      expect(formatMutationFieldValue(value, type)).toBe(expected)
    },
  )

  it('serializes a JSON string as JSON', () => {
    expect(formatMutationFieldValue('value', { type: 'Json' })).toBe('"value"')
  })

  it('does not format ordinary text', () => {
    expect(formatMutationFieldValue('{"enabled":true}', { type: 'Text' })).toBe('{"enabled":true}')
  })
})

describe('parseMutationFieldValue', () => {
  const rowType = {
    type: 'Row',
    columns: [
      { name: 'name', column_type: { type: 'Text' }, nullable: false },
      { name: 'age', column_type: { type: 'Integer' }, nullable: false },
    ],
  } satisfies ColumnType

  it('accepts Row objects and descriptor-compatible tuples', () => {
    expect(parseMutationFieldValue(rowType, '{"name":"Ada","age":37}')).toEqual({
      name: 'Ada',
      age: 37,
    })
    expect(parseMutationFieldValue(rowType, '["Ada",37]')).toEqual({ name: 'Ada', age: 37 })
  })

  it('normalizes nested timestamp array values for Jazz mutations', () => {
    expect(
      parseMutationFieldValue(
        { type: 'Array', element: { type: 'Timestamp' } },
        '["2024-01-02T03:04:05.000Z",1704164645000]',
      ),
    ).toEqual([1704164645000, 1704164645000])
  })

  it('returns safe BigInt values as the number representation accepted by Jazz', () => {
    expect(parseMutationFieldValue({ type: 'BigInt' }, '9007199254740991')).toBe(
      Number.MAX_SAFE_INTEGER,
    )
  })

  it('rejects BigInt values that the Jazz number boundary cannot preserve', () => {
    expect(() => parseMutationFieldValue({ type: 'BigInt' }, '9007199254740993')).toThrow(
      "BigInt value must be within JavaScript's safe integer range.",
    )
  })

  it('rejects JSON null because Jazz reads it back indistinguishably from SQL NULL', () => {
    expect(() => parseMutationFieldValue({ type: 'Json' }, 'null')).toThrow(
      'JSON null is not supported. Use the NULL field mode for SQL NULL.',
    )
  })

  it.each(['["Ada"]', '["Ada","37"]'])('rejects incompatible Row tuple %s', (value) => {
    expect(() => parseMutationFieldValue(rowType, value)).toThrow(
      'Row value must be a valid JSON object or descriptor-compatible tuple.',
    )
  })
})
