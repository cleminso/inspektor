import { describe, expect, it } from 'vitest'

import { getAdjacentNavigationItems } from '@/lib/registry'

describe('getAdjacentNavigationItems', () => {
  it('crosses from foundations into components', () => {
    expect(getAdjacentNavigationItems('/foundations/typography')).toMatchObject({
      previous: { href: '/foundations/colors' },
      next: { href: '/components/accordion' },
    })
  })

  it('wraps across the complete navigation registry', () => {
    expect(getAdjacentNavigationItems('/foundations/colors')).toMatchObject({
      previous: { href: '/components/toggle-group' },
      next: { href: '/foundations/typography' },
    })
  })
})
