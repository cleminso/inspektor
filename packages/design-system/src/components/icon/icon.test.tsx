import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Icon } from './icon'

afterEach(cleanup)

describe('Icon', () => {
  it('composes semantic sizing onto decorative SVG artwork', () => {
    render(<Icon render={<svg data-testid="icon" />} size="xs" />)

    const icon = screen.getByTestId('icon')

    expect(icon.getAttribute('aria-hidden')).toBe('true')
    expect(icon.getAttribute('data-size')).toBe('xs')
    expect(icon.getAttribute('data-slot')).toBe('icon')
    expect(icon.className).not.toBe('')
  })

  it('rejects styling escape hatches', () => {
    // @ts-expect-error Icon only accepts semantic design-system sizing.
    const className = <Icon className="consumer-style" render={<svg />} />
    // @ts-expect-error Icon only accepts semantic design-system sizing.
    const style = <Icon render={<svg />} style={{ width: 12 }} />
    // @ts-expect-error Icon only accepts semantic design-system sizing.
    const width = <Icon render={<svg />} width={12} />

    expect(className).toBeDefined()
    expect(style).toBeDefined()
    expect(width).toBeDefined()
  })
})
