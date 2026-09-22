import { describe, expect, it } from 'vitest'

import { shouldPrepareTableLink } from '@tables/routing/preparedTableLink'

function createEvent(overrides: Partial<Parameters<typeof shouldPrepareTableLink>[0]> = {}) {
  return {
    altKey: false,
    button: 0,
    ctrlKey: false,
    currentTarget: { getAttribute: () => null },
    defaultPrevented: false,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  }
}

describe('shouldPrepareTableLink', () => {
  it('accepts an unmodified primary click in the current browsing context', () => {
    expect(shouldPrepareTableLink(createEvent())).toBe(true)
    expect(
      shouldPrepareTableLink(createEvent({ currentTarget: { getAttribute: () => '_self' } })),
    ).toBe(true)
  })

  it('leaves handled, modified, and external-context clicks to the link', () => {
    expect(shouldPrepareTableLink(createEvent({ defaultPrevented: true }))).toBe(false)
    expect(shouldPrepareTableLink(createEvent({ metaKey: true }))).toBe(false)
    expect(shouldPrepareTableLink(createEvent({ button: 1 }))).toBe(false)
    expect(
      shouldPrepareTableLink(createEvent({ currentTarget: { getAttribute: () => '_blank' } })),
    ).toBe(false)
  })
})
