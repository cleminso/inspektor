import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Checkbox } from './checkbox'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Checkbox', () => {
  it('uses an explicit label relationship for aria-label names', () => {
    const labelsGetter = vi.spyOn(HTMLInputElement.prototype, 'labels', 'get')

    render(<Checkbox aria-label="Select row row-1" />)

    const checkbox = screen.getByRole('checkbox', { name: 'Select row row-1' })
    const labelId = checkbox.getAttribute('aria-labelledby')
    expect(labelId).not.toBeNull()
    expect(document.getElementById(labelId ?? '')?.textContent).toBe('Select row row-1')
    expect(labelsGetter).not.toHaveBeenCalled()
  })

  it('preserves a caller-provided labelled-by relationship over an aria-label', () => {
    render(
      <>
        <span id="selection-label">Select all rows</span>
        <Checkbox
          aria-label="Ignored label"
          aria-labelledby="selection-label"
        />
      </>,
    )

    const checkbox = screen.getByRole('checkbox', { name: 'Select all rows' })
    expect(checkbox.getAttribute('aria-labelledby')).toBe('selection-label')
  })
})
