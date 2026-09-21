import { describe, expect, it } from 'vitest'

import { getFaviconHref } from './favicon'

describe('getFaviconHref', () => {
  it.each([
    [undefined, '/conn/favicon-light.svg'],
    ['production', '/conn/favicon-dark.svg'],
    ['development', '/conn/favicon-dev-light.svg'],
    ['preview', '/conn/favicon-preview-dark.svg'],
    ['unknown', '/conn/favicon-light.svg'],
  ])('maps %s to %s', (mode, expectedHref) => {
    const theme = expectedHref.endsWith('dark.svg') ? 'dark' : 'light'

    expect(getFaviconHref(mode, theme)).toBe(expectedHref)
  })
})
