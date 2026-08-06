import { describe, expect, it } from 'vitest'

import { getTableViewportScrollResetKey } from './tableViewport'

describe('getTableViewportScrollResetKey', () => {
  it('changes when a page-size query finishes loading', () => {
    const loadingKey = getTableViewportScrollResetKey({
      isInitialLoading: true,
      page: 1,
      pageSize: 1000,
    })
    const loadedKey = getTableViewportScrollResetKey({
      isInitialLoading: false,
      page: 1,
      pageSize: 1000,
    })

    expect(loadedKey).not.toBe(loadingKey)
  })
})
