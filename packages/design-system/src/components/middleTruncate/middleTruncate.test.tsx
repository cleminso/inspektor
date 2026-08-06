import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MiddleTruncate } from './middleTruncate'
import { splitMiddleTruncateValue } from './middleTruncateValue'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('splitMiddleTruncateValue', () => {
  it('splits the value into balanced grapheme groups', () => {
    const value = '019ef4a0-1234-5678-9abc-b79ee55705a5'

    expect(splitMiddleTruncateValue(value)).toEqual({
      end: '-9abc-b79ee55705a5',
      start: '019ef4a0-1234-5678',
    })
  })
})

describe('MiddleTruncate', () => {
  it('renders balanced CSS truncation without observing or measuring its width', () => {
    const resizeObserver = vi.fn(() => ({
      disconnect: vi.fn(),
      observe: vi.fn(),
    }))
    vi.stubGlobal('ResizeObserver', resizeObserver)

    const { container } = render(
      <MiddleTruncate value="019ef4a0-1234-5678-9abc-b79ee55705a5" />,
    )

    const start = container.querySelector('[data-slot="middle-truncate-start"]')
    const end = container.querySelector('[data-slot="middle-truncate-end"]')
    const accessibleValue = container.querySelector('[data-slot="middle-truncate-accessible-value"]')

    expect(start?.textContent).toBe('019ef4a0-1234-5678')
    expect(end?.textContent).toBe('-9abc-b79ee55705a5')
    expect(accessibleValue?.textContent).toBe('019ef4a0-1234-5678-9abc-b79ee55705a5')
    expect(container.querySelector('[data-slot="middle-truncate-measurement"]')).toBeNull()
    expect(resizeObserver).not.toHaveBeenCalled()
  })
})
