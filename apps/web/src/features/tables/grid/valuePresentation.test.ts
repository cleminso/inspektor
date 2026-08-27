import type { ColumnDescriptor, ColumnType } from 'jazz-tools'
import { describe, expect, it, vi } from 'vitest'

import { classifySchemaValue } from '@tables/grid/valuePresentation'

function column(
  columnType: ColumnType,
  overrides: Partial<ColumnDescriptor> = {},
): ColumnDescriptor {
  return {
    column_type: columnType,
    name: 'value',
    nullable: false,
    ...overrides,
  }
}

describe('classifySchemaValue', () => {
  it('distinguishes NULL, empty strings, and unavailable values while preserving raw values', () => {
    const nullableText = column({ type: 'Text' }, { nullable: true })

    const nullValue = classifySchemaValue(null, nullableText)
    const emptyValue = classifySchemaValue('', nullableText)
    const unavailableValue = classifySchemaValue(undefined, nullableText)

    expect(nullValue).toMatchObject({ kind: 'null', displayValue: 'NULL', rawValue: null })
    expect(emptyValue).toMatchObject({ kind: 'text', displayValue: '""', rawValue: '' })
    expect(unavailableValue).toMatchObject({
      kind: 'unavailable',
      displayValue: 'Unavailable',
      rawValue: undefined,
    })
  })

  it('classifies primitive values without shortening their raw display text', () => {
    const longText = 'a primitive value that exceeds a narrow table column'

    expect(classifySchemaValue(longText, column({ type: 'Text' }))).toMatchObject({
      kind: 'text',
      displayValue: longText,
      rawValue: longText,
    })
    expect(classifySchemaValue(1200.25, column({ type: 'Double' }))).toMatchObject({
      kind: 'number',
      displayValue: '1200.25',
      rawValue: 1200.25,
    })
    expect(classifySchemaValue(true, column({ type: 'Boolean' }))).toMatchObject({
      kind: 'boolean',
      rawValue: true,
      value: true,
    })
  })

  it('accepts valid Date and epoch timestamps and exposes epoch milliseconds', () => {
    const rawValue = new Date('2026-07-27T14:03:04.987Z')

    expect(classifySchemaValue(rawValue, column({ type: 'Timestamp' }))).toEqual({
      kind: 'timestamp',
      rawValue,
      epochMilliseconds: rawValue.getTime(),
    })
    expect(classifySchemaValue(rawValue.getTime(), column({ type: 'Timestamp' }))).toMatchObject({
      kind: 'timestamp',
      epochMilliseconds: rawValue.getTime(),
    })
  })

  it('keeps malformed timestamp raw values in an invalid state', () => {
    const rawValue = 'not-a-timestamp'

    expect(classifySchemaValue(rawValue, column({ type: 'Timestamp' }))).toEqual({
      kind: 'invalid',
      displayValue: rawValue,
      expectation: 'a valid Date or epoch milliseconds',
      rawValue,
      reason: 'Invalid timestamp',
    })
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 8_640_000_000_000_001, new Date(Number.NaN)])(
    'rejects malformed or out-of-range timestamp %s',
    (rawValue) => {
      expect(classifySchemaValue(rawValue, column({ type: 'Timestamp' }))).toMatchObject({
        kind: 'invalid',
        rawValue,
      })
    },
  )

  it.each([
    [9_007_199_254_740_991, '9007199254740991'],
    [9_007_199_254_740_993n, '9007199254740993'],
    ['9007199254740993123456789', '9007199254740993123456789'],
  ] as const)('preserves realistic BigInt runtime value %s', (rawValue, displayValue) => {
    expect(classifySchemaValue(rawValue, column({ type: 'BigInt' }))).toMatchObject({
      kind: 'number',
      rawValue,
      displayValue,
    })
  })

  it.each([1.5, '1.5', '12px', Number.POSITIVE_INFINITY])(
    'rejects malformed BigInt runtime value %s',
    (rawValue) => {
      expect(classifySchemaValue(rawValue, column({ type: 'BigInt' }))).toMatchObject({
        kind: 'invalid',
        rawValue,
      })
    },
  )

  it.each([
    [{ type: 'Text' }, 42, 'text'],
    [{ type: 'Uuid' }, {}, 'text'],
    [{ type: 'Integer' }, 1.5, 'an integer'],
    [{ type: 'Double' }, Number.POSITIVE_INFINITY, 'a finite number'],
    [{ type: 'Boolean' }, 'true', 'a boolean'],
    [{ type: 'Bytea' }, [1, 2], 'a Uint8Array'],
  ] satisfies readonly [ColumnType, unknown, string][])(
    'rejects invalid %s scalar runtime values',
    (columnType, rawValue, expectation) => {
      expect(classifySchemaValue(rawValue, column(columnType))).toMatchObject({
        kind: 'invalid',
        rawValue,
        expectation,
      })
    },
  )

  it('represents bytes by count without serializing indexed values', () => {
    const rawValue = new Uint8Array(2_000)
    const presentation = classifySchemaValue(rawValue, column({ type: 'Bytea' }))

    expect(presentation).toEqual({
      kind: 'bytes',
      rawValue,
      value: rawValue,
      byteLength: 2_000,
    })
    expect(classifySchemaValue(new Uint8Array(), column({ type: 'Bytea' }))).toMatchObject({
      kind: 'bytes',
      byteLength: 0,
    })
  })

  it('keeps the stored relation ID as the relation presentation', () => {
    const rawValue = 'account_0123456789'

    expect(
      classifySchemaValue(rawValue, column({ type: 'Uuid' }, { references: 'accounts' })),
    ).toEqual({
      kind: 'relation',
      rawValue,
      relationId: rawValue,
      relationTable: 'accounts',
    })
  })

  it('keeps reference arrays as bounded structured raw-ID previews', () => {
    const rawValue = ['account-1', 'account-2', 'account-3', 'account-4']
    const presentation = classifySchemaValue(
      rawValue,
      column({ type: 'Array', element: { type: 'Uuid' } }, { references: 'accounts' }),
    )

    expect(presentation).toMatchObject({
      kind: 'structured',
      model: {
        kind: 'array',
        entries: ['"account-1"', '"account-2"', '"account-3"'],
        totalCount: 4,
        continuation: 'truncated',
      },
      rawValue,
    })
  })

  it('classifies valid and malformed enum values against schema variants', () => {
    const enumColumn = column({ type: 'Enum', variants: ['reader', 'writer'] })

    expect(classifySchemaValue('reader', enumColumn)).toMatchObject({
      kind: 'enum',
      displayValue: 'reader',
      value: 'reader',
    })
    expect(classifySchemaValue('owner', enumColumn)).toMatchObject({
      kind: 'invalid',
      displayValue: 'owner',
      rawValue: 'owner',
    })
  })

  it('creates bounded summaries for arrays and JSON without complete serialization', () => {
    const arrayValue = Array.from({ length: 20 }, (_, index) => `item-${index}-${'x'.repeat(40)}`)
    const jsonValue = Object.fromEntries(
      Array.from({ length: 20 }, (_, index) => [`field${index}`, 'x'.repeat(80)]),
    )

    const arrayPresentation = classifySchemaValue(
      arrayValue,
      column({ type: 'Array', element: { type: 'Text' } }),
    )
    const jsonPresentation = classifySchemaValue(
      jsonValue,
      column({ type: 'Json', schema: { type: 'object' } }),
    )

    expect(arrayPresentation).toMatchObject({
      kind: 'structured',
      rawValue: arrayValue,
      model: { kind: 'array', totalCount: 20, continuation: 'truncated' },
    })
    expect(jsonPresentation).toMatchObject({
      kind: 'structured',
      rawValue: jsonValue,
      variant: 'typedJson',
      model: { kind: 'object', totalCount: null, continuation: 'truncated' },
    })
  })

  it('bounds nested string summaries before JSON escaping the preview', () => {
    const stringify = vi.spyOn(JSON, 'stringify')
    const longValue = `${'line "one" '.repeat(20_000)}unread tail`

    const presentation = classifySchemaValue(
      [longValue],
      column({ type: 'Array', element: { type: 'Text' } }),
    )

    expect(presentation).toMatchObject({
      kind: 'structured',
      model: {
        kind: 'array',
        entries: ['"line \\"one\\" line \\"on..."'],
      },
    })
    expect(
      stringify.mock.calls.some(([value]) => typeof value === 'string' && value.length > 24),
    ).toBe(false)
  })

  it('accepts Row records and descriptor-compatible tuples', () => {
    const rowColumn = column({
      type: 'Row',
      columns: [
        column({ type: 'Text' }, { name: 'name' }),
        column({ type: 'Integer' }, { name: 'age' }),
      ],
    })

    expect(classifySchemaValue({ name: 'Ada', age: 37 }, rowColumn)).toMatchObject({
      kind: 'structured',
    })
    expect(classifySchemaValue(['Ada', 37], rowColumn)).toMatchObject({
      kind: 'structured',
      rawValue: ['Ada', 37],
    })
  })

  it.each([
    [['Ada'], false],
    [['Ada', '37'], false],
    [['unexpected'], true],
  ])('rejects unrelated Row array %j', (rawValue, emptyDescriptor) => {
    const columns =
      emptyDescriptor === true
        ? []
        : [column({ type: 'Text' }, { name: 'name' }), column({ type: 'Integer' }, { name: 'age' })]

    expect(classifySchemaValue(rawValue, column({ type: 'Row', columns }))).toMatchObject({
      kind: 'invalid',
      expectation: 'a Row object or descriptor-compatible tuple',
    })
  })

  it('uses a bounded raw fallback for unsupported values', () => {
    const rawValue = Symbol('x'.repeat(200))
    const presentation = classifySchemaValue(rawValue, column({ type: 'Text' }))

    expect(presentation).toMatchObject({ kind: 'unsupported', rawValue })
    if (presentation.kind !== 'unsupported') {
      throw new Error('Expected an unsupported presentation')
    }
    expect(presentation.displayValue.length).toBeLessThanOrEqual(80)
  })

  it.each([
    ['Array', { unexpected: true }],
    ['Json', new Date(0)],
    ['Json', new Map([['name', 'Ada']])],
    ['Json', new Set(['Ada'])],
    ['Row', new (class RowValue {})()],
  ] as const)('rejects a top-level %s runtime shape mismatch', (type, rawValue) => {
    const columnType: ColumnType =
      type === 'Array'
        ? { type, element: { type: 'Text' } }
        : type === 'Row'
          ? { type, columns: [] }
          : { type }

    expect(classifySchemaValue(rawValue, column(columnType))).toMatchObject({
      kind: 'invalid',
      rawValue,
      expectation: expect.any(String),
      reason: expect.any(String),
    })
  })

  it('rejects whitespace-only scalar relation IDs', () => {
    expect(
      classifySchemaValue('  \n ', column({ type: 'Uuid' }, { references: 'accounts' })),
    ).toMatchObject({
      kind: 'invalid',
      expectation: 'a non-empty relation ID',
    })
  })

  it('returns an invalid presentation when top-level object enumeration or access throws', () => {
    const throwingGetter = Object.defineProperty({}, 'value', {
      enumerable: true,
      get() {
        throw new Error('getter failure')
      },
    })
    const throwingProxy = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error('proxy failure')
        },
      },
    )

    expect(classifySchemaValue(throwingGetter, column({ type: 'Json' }))).toMatchObject({
      kind: 'invalid',
      reason: 'Could not inspect the structured value',
    })
    expect(classifySchemaValue(throwingProxy, column({ type: 'Row', columns: [] }))).toMatchObject({
      kind: 'invalid',
      reason: 'Could not inspect the structured value',
    })
  })

  it('bounds ordinary object enumeration and represents an unknown exact count', () => {
    let getterReads = 0
    const rawValue: Record<string, unknown> = {}
    for (let index = 0; index < 100; index += 1) {
      Object.defineProperty(rawValue, `field${index}`, {
        enumerable: true,
        get() {
          getterReads += 1
          return index
        },
      })
    }

    expect(classifySchemaValue(rawValue, column({ type: 'Json' }))).toMatchObject({
      kind: 'structured',
      model: {
        kind: 'object',
        entries: [
          { label: 'field0', value: '0' },
          { label: 'field1', value: '1' },
          { label: 'field2', value: '2' },
        ],
        totalCount: null,
        continuation: 'truncated',
      },
    })
    expect(getterReads).toBe(3)
  })

  it('carries semantic byte, timestamp, and structured payloads without display strings', () => {
    const bytes = classifySchemaValue(new Uint8Array([1, 2]), column({ type: 'Bytea' }))
    const timestamp = classifySchemaValue(1_000, column({ type: 'Timestamp' }))
    const structured = classifySchemaValue(
      ['reader'],
      column({
        type: 'Array',
        element: { type: 'Text' },
      }),
    )

    expect(bytes).toMatchObject({ kind: 'bytes', byteLength: 2 })
    expect(timestamp).toMatchObject({ kind: 'timestamp', epochMilliseconds: 1_000 })
    expect(structured).toMatchObject({
      kind: 'structured',
      model: { kind: 'array', totalCount: 1, entries: ['"reader"'] },
    })
    expect(bytes).not.toHaveProperty('displayValue')
    expect(timestamp).not.toHaveProperty('displayValue')
    expect(structured).not.toHaveProperty('displayValue')
  })
})
