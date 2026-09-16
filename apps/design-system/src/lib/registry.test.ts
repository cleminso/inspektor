import { describe, expect, it } from 'vitest'

import { docsItems, docsSections } from './registry'

describe('documentation registry', () => {
  it('keeps page paths and slugs unique', () => {
    expect(new Set(docsItems.map((item) => item.href)).size).toBe(docsItems.length)
    expect(new Set(docsItems.map((item) => item.slug)).size).toBe(docsItems.length)
  })

  it('keeps foundations first and preserves the complete component catalog', () => {
    expect(docsSections.map((section) => section.title)).toEqual(['Foundations', 'Components'])
    expect(docsSections[0]?.items.map((item) => item.title)).toEqual(['Colors', 'Typography'])
    expect(docsSections[1]?.items).toHaveLength(56)
    expect(docsItems).toHaveLength(58)
  })
})
