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

  it('keeps malformed structured runtime values representable', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic

    expect(formatMutationFieldValue(cyclic, { type: 'Json' })).toBe('[object Object]')
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

  it('uses one valid Date range for top-level and nested timestamps', () => {
    expect(parseMutationFieldValue({ type: 'Timestamp' }, '1.5')).toBe(1)
    expect(
      parseMutationFieldValue({ type: 'Array', element: { type: 'Timestamp' } }, '[1.5]'),
    ).toEqual([1])
    expect(() => parseMutationFieldValue({ type: 'Timestamp' }, '8640000000000001')).toThrow(
      'Timestamp must be milliseconds or an ISO date string.',
    )
    expect(() =>
      parseMutationFieldValue(
        { type: 'Array', element: { type: 'Timestamp' } },
        '[8640000000000001]',
      ),
    ).toThrow('Array must be valid JSON array.')
    expect(() =>
      parseMutationFieldValue({ type: 'Array', element: { type: 'Timestamp' } }, '[""]'),
    ).toThrow('Array must be valid JSON array.')
  })

  it('returns safe BigInt values as the number representation accepted by Jazz', () => {
    expect(parseMutationFieldValue({ type: 'BigInt' }, '9007199254740991')).toBe(
      Number.MAX_SAFE_INTEGER,
    )
  })

  it('rejects Integer values outside the signed 32-bit range accepted by Jazz', () => {
    expect(parseMutationFieldValue({ type: 'Integer' }, '-2147483648')).toBe(-2_147_483_648)
    expect(parseMutationFieldValue({ type: 'Integer' }, '2147483647')).toBe(2_147_483_647)
    expect(() => parseMutationFieldValue({ type: 'Integer' }, '2147483648')).toThrow(
      'Value must be a signed 32-bit integer.',
    )
    expect(() => parseMutationFieldValue({ type: 'Integer' }, '-2147483649')).toThrow(
      'Value must be a signed 32-bit integer.',
    )
    expect(() =>
      parseMutationFieldValue(
        { type: 'Array', element: { type: 'Integer' } },
        '[2147483648]',
      ),
    ).toThrow('Array must be valid JSON array.')
    expect(() =>
      parseMutationFieldValue(
        {
          type: 'Row',
          columns: [
            { name: 'count', column_type: { type: 'Integer' }, nullable: false },
          ],
        },
        '{"count":-2147483649}',
      ),
    ).toThrow('Row value must be a valid JSON object or descriptor-compatible tuple.')
  })

  it('rejects malformed UUID values at the mutation parsing boundary', () => {
    expect(() => parseMutationFieldValue({ type: 'Uuid' }, 'sf')).toThrow(
      'Value must be a UUID.',
    )
    expect(() =>
      parseMutationFieldValue({ type: 'Array', element: { type: 'Uuid' } }, '["sf"]'),
    ).toThrow('Array must be valid JSON array.')
  })

  it('accepts the UUID representations accepted by Jazz', () => {
    expect(
      parseMutationFieldValue({ type: 'Uuid' }, '03c905ac-d9a6-58b8-8d90-5dc3b9df6038'),
    ).toBe('03c905ac-d9a6-58b8-8d90-5dc3b9df6038')
    expect(parseMutationFieldValue({ type: 'Uuid' }, '03C905ACD9A658B88D905DC3B9DF6038')).toBe(
      '03C905ACD9A658B88D905DC3B9DF6038',
    )
  })

  it('rejects Integer values that JavaScript cannot preserve exactly', () => {
    expect(() => parseMutationFieldValue({ type: 'Integer' }, '9007199254740993')).toThrow(
      'Value must be within JavaScript safe integer range.',
    )
    expect(() =>
      parseMutationFieldValue(
        { type: 'Array', element: { type: 'Integer' } },
        '[9007199254740993]',
      ),
    ).toThrow('Array must be valid JSON array.')
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

  it.each([
    [{ type: 'Array', element: { type: 'Text' } }, 'null', 'Array must be valid JSON array.'],
    [{ type: 'Array', element: { type: 'Text' } }, '[null]', 'Array must be valid JSON array.'],
    [
      rowType,
      'null',
      'Row value must be a valid JSON object or descriptor-compatible tuple.',
    ],
  ] satisfies [ColumnType, string, string][])('rejects structured NULL value %s', (type, value, error) => {
    expect(() => parseMutationFieldValue(type, value)).toThrow(error)
  })

  it.each(['["Ada"]', '["Ada","37"]'])('rejects incompatible Row tuple %s', (value) => {
    expect(() => parseMutationFieldValue(rowType, value)).toThrow(
      'Row value must be a valid JSON object or descriptor-compatible tuple.',
    )
  })
})
