import { cleanup, render } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { Icon } from './icon'
import { iconStyles } from './icon.styles'

const TestArtwork = forwardRef<SVGSVGElement, ComponentPropsWithoutRef<'svg'>>(
  function TestArtwork(props, ref) {
    return (
      <svg {...props} ref={ref} viewBox="0 0 16 16">
        <path d="m3 8 3 3 7-7" />
      </svg>
    )
  },
)

function PlainArtwork(props: ComponentPropsWithoutRef<'svg'>) {
  return <svg {...props} viewBox="0 0 16 16" />
}

afterEach(cleanup)

describe('Icon', () => {
  it('renders imported SVG artwork with decorative semantics', () => {
    render(<Icon artwork={TestArtwork} size="xs" />)

    const icon = document.querySelector('[data-slot="icon"]')

    expect(icon?.tagName.toLowerCase()).toBe('svg')
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(icon?.getAttribute('focusable')).toBe('false')
    expect(icon?.getAttribute('data-size')).toBe('xs')
  })

  it('uses the semantic small size by default', () => {
    render(<Icon artwork={TestArtwork} />)

    expect(document.querySelector('[data-slot="icon"]')?.getAttribute('data-size')).toBe('s')
  })

  it('maps every semantic size to its design-system style', () => {
    const sizes = [
      ['xs', iconStyles.xs],
      ['s', iconStyles.s],
      ['m', iconStyles.m],
    ] as const

    for (const [size, expectedStyle] of sizes) {
      const { unmount } = render(<Icon artwork={TestArtwork} size={size} />)
      const icon = document.querySelector('[data-slot="icon"]')
      const expectedClassName = stylex.props(expectedStyle).className

      expect(expectedClassName).toBeDefined()
      if (expectedClassName !== undefined) {
        for (const className of expectedClassName.split(' ')) {
          expect(icon?.classList.contains(className)).toBe(true)
        }
      }
      unmount()
    }
  })

  it('forwards a ref to the rendered SVG', () => {
    const ref = { current: null as SVGSVGElement | null }

    render(<Icon artwork={TestArtwork} ref={ref} />)

    expect(ref.current?.tagName.toLowerCase()).toBe('svg')
  })

  it('accepts an SVG component rather than configured artwork or a render callback', () => {
    // @ts-expect-error Icon accepts an SVG component, not a configured element.
    const element = <Icon artwork={<TestArtwork />} />
    // @ts-expect-error Icon does not support render callbacks or non-SVG targets.
    const callback = <Icon render={(props: object) => <span {...props} />} />
    // @ts-expect-error Icon artwork must be an SVG component.
    const nonSvg = <Icon artwork="span" />
    // @ts-expect-error Icon artwork must expose a React 18-compatible forwarded SVG ref.
    const plainComponent = <Icon artwork={PlainArtwork} />

    expect(element).toBeDefined()
    expect(callback).toBeDefined()
    expect(nonSvg).toBeDefined()
    expect(plainComponent).toBeDefined()
  })

  it('rejects presentation and accessibility escape hatches', () => {
    // @ts-expect-error Icon only accepts semantic design-system sizing.
    const className = <Icon artwork={TestArtwork} className="consumer-style" />
    // @ts-expect-error Icon only accepts semantic design-system sizing.
    const style = <Icon artwork={TestArtwork} style={{ width: 12 }} />
    // @ts-expect-error Icon only accepts semantic design-system sizing.
    const width = <Icon artwork={TestArtwork} width={12} />
    // @ts-expect-error Icon artwork controls its own documented stroke category.
    const stroke = <Icon artwork={TestArtwork} strokeWidth={3} />

    expect(className).toBeDefined()
    expect(style).toBeDefined()
    expect(width).toBeDefined()
    expect(stroke).toBeDefined()
  })

  it('does not forward unsupported accessibility attributes', () => {
    const props = {
      artwork: TestArtwork,
      'aria-label': 'Completed',
      role: 'img',
    }

    render(<Icon {...props} />)

    const icon = document.querySelector('[data-slot="icon"]')
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(icon?.getAttribute('aria-label')).toBeNull()
    expect(icon?.getAttribute('role')).toBeNull()
  })
})
