import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MiddleTruncate } from './middleTruncate'
import { getMiddleTruncatedValue } from './middleTruncateValue'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('getMiddleTruncatedValue', () => {
  it('keeps the complete value when it fits', () => {
    const value = '019ef4a0-1234-5678-9abc-b79ee55705a5'

    expect(getMiddleTruncatedValue(value, (candidate) => candidate.length <= value.length)).toBe(
      value,
    )
  })

  it('preserves the start and end around one ellipsis', () => {
    const value = '019ef4a0-1234-5678-9abc-b79ee55705a5'

    expect(getMiddleTruncatedValue(value, (candidate) => candidate.length <= 17)).toBe(
      '019ef4a0…e55705a5',
    )
  })
})

describe('MiddleTruncate', () => {
  it('renders a width-aware preview while retaining the complete accessible value', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(90)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.getAttribute('data-slot') === 'middle-truncate-measurement'
        ? Array.from(this.textContent ?? '').length * 10
        : 90

      return {
        bottom: 0,
        height: 0,
        left: 0,
        right: width,
        top: 0,
        width,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }
    })

    const { container } = render(
      <MiddleTruncate value="019ef4a0-1234-5678-9abc-b79ee55705a5" />,
    )

    const root = container.querySelector('[data-slot="middle-truncate"]')
    const preview = container.querySelector('[data-slot="middle-truncate-preview"]')
    const accessibleValue = container.querySelector('[data-slot="middle-truncate-accessible-value"]')

    await waitFor(() => expect(preview?.textContent).toBe('019e…05a5'))
    expect(root?.getAttribute('data-truncated')).toBe('true')
    expect(preview?.getAttribute('aria-hidden')).toBe('true')
    expect(accessibleValue?.textContent).toBe('019ef4a0-1234-5678-9abc-b79ee55705a5')
  })
})
