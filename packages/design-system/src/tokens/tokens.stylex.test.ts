import { describe, expect, it } from 'vitest'

import { borderRadiusValues, dimensionValues, fontSizeValues, spacingValues } from './value.stylex'

describe('primitive length policy', () => {
  it('uses root-relative scalable lengths and pixels only for physical boundaries', () => {
    const scalableLengths = [
      ...Object.values(fontSizeValues),
      ...Object.values(spacingValues),
      ...Object.values(borderRadiusValues),
      ...Object.entries(dimensionValues)
        .filter(([key]) => key !== '1' && key !== '2')
        .map(([, value]) => value),
    ].filter((value) => value !== '0')

    expect(scalableLengths.every((value) => value.endsWith('rem'))).toBe(true)
    expect([dimensionValues[1], dimensionValues[2]].every((value) => value.endsWith('px'))).toBe(
      true,
    )
  })
})
