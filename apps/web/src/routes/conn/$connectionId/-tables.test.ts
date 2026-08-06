import { describe, expect, it } from 'vitest'

import { parsePositiveInteger } from './tables'

describe('parsePositiveInteger', () => {
  it('rejects integers that cannot produce precise pagination offsets', () => {
    expect(parsePositiveInteger(Number.MAX_SAFE_INTEGER + 1)).toBeUndefined()
    expect(parsePositiveInteger(String(Number.MAX_SAFE_INTEGER + 1))).toBeUndefined()
  })

  it('accepts positive safe integers', () => {
    expect(parsePositiveInteger(2)).toBe(2)
    expect(parsePositiveInteger('2')).toBe(2)
  })
})
