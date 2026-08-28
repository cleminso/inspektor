import { describe, expect, it } from 'vitest'

import { resolveStagedFieldValue } from '@tables/grid/stagedFieldValue'

describe('resolveStagedFieldValue', () => {
  it('uses the source field when no staged field exists', () => {
    expect(resolveStagedFieldValue({ name: 'Ada' }, {}, 'name')).toBe('Ada')
  })

  it('preserves an explicit staged null', () => {
    expect(resolveStagedFieldValue({ name: 'Ada' }, { name: null }, 'name')).toBeNull()
  })

  it('preserves an explicit staged undefined', () => {
    expect(resolveStagedFieldValue({ name: 'Ada' }, { name: undefined }, 'name')).toBeUndefined()
  })
})
