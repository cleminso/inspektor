import { cleanup, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { ScrollArea } from './scrollArea'

afterEach(cleanup)

describe('ScrollArea', () => {
  it('forwards its ref to a vertical native viewport by default', () => {
    const viewportRef = createRef<HTMLDivElement>()
    const { container } = render(
      <ScrollArea ref={viewportRef} aria-label="Scrollable content">
        Content
      </ScrollArea>,
    )

    const viewport = screen.getByLabelText('Scrollable content')
    const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')

    expect((viewport as HTMLElement).style.overflowX).toBe('hidden')
    expect((viewport as HTMLElement).style.overflowY).toBe('scroll')
    expect(scrollbar?.getAttribute('data-orientation')).toBe('vertical')
    expect(viewportRef.current).toBe(viewport)
  })

  it('renders both overlay tracks without adding them to the viewport', () => {
    const { container } = render(<ScrollArea axis="both">Content</ScrollArea>)

    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')
    const scrollbars = Array.from(
      container.querySelectorAll('[data-slot="scroll-area-scrollbar"]'),
    )

    expect(scrollbars.map((scrollbar) => scrollbar.getAttribute('data-orientation'))).toEqual([
      'vertical',
      'horizontal',
    ])
    expect(scrollbars.every((scrollbar) => viewport?.contains(scrollbar) === false)).toBe(true)
  })

  it('can retain its viewport and content while an inner control owns scrolling', () => {
    const { container } = render(<ScrollArea axis="none">Content</ScrollArea>)

    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')

    expect((viewport as HTMLElement).style.overflow).toBe('hidden')
    expect(container.querySelectorAll('[data-slot="scroll-area-scrollbar"]')).toHaveLength(0)
  })
})
