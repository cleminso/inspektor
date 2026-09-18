import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MiddleTruncate } from './middleTruncate'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('MiddleTruncate', () => {
  it('preserves both ends without measuring layout', () => {
    const measure = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => {
        throw new Error('MiddleTruncate must not measure layout')
      })

    const { container } = render(<MiddleTruncate value="ábcdefghij" />)
    const leading = container.querySelector('[data-slot="middle-truncate-leading"]')
    const trailing = container.querySelector('[data-slot="middle-truncate-trailing"]')
    const accessibleValue = container.querySelector(
      '[data-slot="middle-truncate-accessible-value"]',
    )

    expect(leading?.textContent).toBe('ábcde')
    expect(trailing?.textContent).toBe('fghij')
    expect(accessibleValue?.textContent).toBe('ábcdefghij')
    expect(measure).not.toHaveBeenCalled()
  })
})
