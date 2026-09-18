import type { ColumnDescriptor } from 'jazz-tools'
import { describe, expect, it } from 'vitest'

import { parseTimestampValue, safelySerializeStructuredValue } from './fieldPresentation'

const jsonColumn = {
  column_type: { type: 'Json' },
  name: 'details',
  nullable: false,
} satisfies ColumnDescriptor

describe('safelySerializeStructuredValue', () => {
  it('reads each ordinary structured property once during serialization', () => {
    let getterReads = 0
    const value = Object.defineProperty({}, 'name', {
      enumerable: true,
      get() {
        getterReads += 1
        return 'Ada'
      },
    })

    expect(safelySerializeStructuredValue(value, jsonColumn)).toEqual({
      source: '{\n  "name": "Ada"\n}',
      fallback: null,
    })
    expect(getterReads).toBe(1)
  })

  it('serializes nested binary as a bounded marker while traversing the value once', () => {
    let payloadReads = 0
    const nested = Object.defineProperty({}, 'payload', {
      enumerable: true,
      get() {
        payloadReads += 1
        return new Uint8Array([0, 1, 2])
      },
    })
    const presentation = safelySerializeStructuredValue({ nested }, jsonColumn)

    expect(presentation).toEqual({
      source:
        '{\n  "nested": {\n    "payload": {\n      "$type": "bytes",\n      "byteLength": 3\n    }\n  }\n}',
      fallback: null,
    })
    expect(payloadReads).toBe(1)
    expect(presentation.source).not.toContain('"0"')
  })

  it('falls back for an unsupported runtime object', () => {
    expect(safelySerializeStructuredValue(new Map([['name', 'Ada']]), jsonColumn)).toEqual({
      source: null,
      fallback: { $type: 'unsupported', valueType: 'object' },
    })
  })
})

describe('parseTimestampValue', () => {
  it('preserves milliseconds from an epoch timestamp', () => {
    expect(parseTimestampValue('1704164645678')).toEqual(new Date(1704164645678))
  })

  it('accepts ISO timestamps and rejects invalid text', () => {
    expect(parseTimestampValue('2024-01-02T03:04:05.678Z')).toEqual(
      new Date('2024-01-02T03:04:05.678Z'),
    )
    expect(parseTimestampValue('not-a-timestamp')).toBeUndefined()
    expect(parseTimestampValue('8640000000000001')).toBeUndefined()
    expect(parseTimestampValue('1.5')).toEqual(new Date(1))
  })
})
