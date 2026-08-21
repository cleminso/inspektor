import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CheckGlyph, ChevronDownGlyph, ChevronRightGlyph, CloseGlyph } from './iconArtwork'

afterEach(cleanup)

describe('package-private icon artwork', () => {
  it('shares checked and indeterminate indicator geometry', () => {
    const { container, rerender } = render(<CheckGlyph data-artwork="check" />)
    const checkedPath = container.querySelector('path')?.getAttribute('d')

    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('svg')?.getAttribute('data-artwork')).toBe('check')
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 16 16')

    rerender(<CheckGlyph variant="indeterminate" />)
    expect(container.querySelector('path')?.getAttribute('d')).not.toBe(checkedPath)
  })

  it('shares inset and edge close geometry', () => {
    const { container, rerender } = render(<CloseGlyph />)
    const insetPath = container.querySelector('path')?.getAttribute('d')

    rerender(<CloseGlyph geometry="edge" />)
    expect(container.querySelector('path')?.getAttribute('d')).not.toBe(insetPath)
  })

  it('keeps stroked and solid disclosure categories explicit', () => {
    const { container, rerender } = render(<ChevronDownGlyph />)
    const strokedPath = container.querySelector('path')?.getAttribute('d')

    rerender(<ChevronDownGlyph variant="solid" />)
    expect(container.querySelector('path')?.getAttribute('d')).not.toBe(strokedPath)

    rerender(<ChevronRightGlyph />)
    expect(container.querySelector('path')?.getAttribute('d')).not.toMatch(/[zZ]\s*$/)
  })
})
