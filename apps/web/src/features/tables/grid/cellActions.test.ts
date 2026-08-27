import { describe, expect, it } from 'vitest'

import { serializeCellValueForClipboard } from '@tables/grid/cellActions'

describe('serializeCellValueForClipboard', () => {
  it('preserves scalar values and uses the visible NULL representation', () => {
    expect(serializeCellValueForClipboard('Ada')).toEqual({
      text: 'Ada',
      toast: 'Cell value copied',
    })
    expect(serializeCellValueForClipboard(42)).toEqual({
      text: '42',
      toast: 'Cell value copied',
    })
    expect(serializeCellValueForClipboard(null)).toEqual({
      text: 'NULL',
      toast: 'Cell value copied',
    })
  })

  it('serializes structured values as JSON', () => {
    expect(
      serializeCellValueForClipboard({
        count: 9_007_199_254_740_993n,
        nested: { payload: new Uint8Array([1, 2, 3]) },
      }),
    ).toEqual({
      text: '{"count":"9007199254740993","nested":{"payload":[1,2,3]}}',
      toast: 'Cell value copied',
    })
  })

  it('copies Date timestamps as unquoted ISO text', () => {
    expect(serializeCellValueForClipboard(new Date('2024-01-01T00:00:00.000Z'))).toEqual({
      text: '2024-01-01T00:00:00.000Z',
      toast: 'Cell value copied',
    })
  })

  it('uses hex as the default binary representation and supports explicit formats', () => {
    const value = new Uint8Array([0, 1, 254, 255])

    expect(serializeCellValueForClipboard(value)).toEqual({
      text: '0001feff',
      toast: 'Cell value copied as Hex',
    })
    expect(serializeCellValueForClipboard(value, 'base64')).toEqual({
      text: 'AAH+/w==',
      toast: 'Cell value copied as Base64',
    })
  })

  it.each([
    ['an unavailable value', undefined],
    ['an invalid Date', new Date(Number.NaN)],
    [
      'a circular object',
      (() => {
        const value: { self?: unknown } = {}
        value.self = value
        return value
      })(),
    ],
    [
      'an object with a throwing JSON serializer',
      {
        toJSON: () => {
          throw new Error('failure')
        },
      },
    ],
  ])('rejects %s', (_name, value) => {
    expect(() => serializeCellValueForClipboard(value)).toThrow('Cell value is unavailable.')
  })
})
