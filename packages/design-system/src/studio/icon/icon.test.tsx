import { cleanup, render } from '@testing-library/react'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { Icon } from './icon'

const TestArtwork = forwardRef<SVGSVGElement, ComponentPropsWithoutRef<'svg'>>(
  function TestArtwork(props, ref) {
    return <svg {...props} ref={ref} viewBox="0 0 16 16" />
  },
)

function PlainArtwork(props: ComponentPropsWithoutRef<'svg'>) {
  return <svg {...props} viewBox="0 0 16 16" />
}

afterEach(cleanup)

describe('Icon', () => {
  it('owns decorative semantics and the default semantic size', () => {
    const props = {
      artwork: TestArtwork,
      'aria-label': 'Completed',
      role: 'img',
    }
    render(<Icon {...props} />)

    const icon = document.querySelector('svg')

    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(icon?.getAttribute('focusable')).toBe('false')
    expect(icon?.getAttribute('data-size')).toBe('s')
    expect(icon?.getAttribute('aria-label')).toBeNull()
    expect(icon?.getAttribute('role')).toBeNull()
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
})
