import { afterEach, describe, expect, it } from 'vitest'

import {
  beginAutomaticConnectionRecovery,
  clearAutomaticConnectionRecovery,
} from './connectionRecovery'

afterEach(() => {
  clearAutomaticConnectionRecovery()
})

describe('automatic connection recovery', () => {
  it('allows one document recovery for the current location', () => {
    expect(beginAutomaticConnectionRecovery()).toBe(true)
    expect(beginAutomaticConnectionRecovery()).toBe(false)
  })

  it('allows a later incident after the runtime stabilizes', () => {
    expect(beginAutomaticConnectionRecovery()).toBe(true)

    clearAutomaticConnectionRecovery()

    expect(beginAutomaticConnectionRecovery()).toBe(true)
  })
})
