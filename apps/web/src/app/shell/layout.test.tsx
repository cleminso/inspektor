import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InspectorLayout } from './layout'

vi.mock('./header/view', () => ({
  InspectorHeader: () => <header>Header</header>,
}))

afterEach(cleanup)

describe('InspectorLayout', () => {
  it('locks the application shell to the viewport', () => {
    const { container } = render(
      <InspectorLayout pageTitle="Tables">
        <div>Content</div>
      </InspectorLayout>,
    )
    const root = container.firstElementChild as HTMLElement

    expect(root.classList.contains('h-dvh')).toBe(false)
    expect(root.className).not.toBe('')
    expect(root.style.height).toMatch(/^var\(--/)
    expect(root.getAttribute('data-layout')).toBe('viewport')
    expect(root.getAttribute('data-page-scroll')).toBe('locked')
  })

  it('provides a skip link and a focusable titled main landmark', () => {
    render(
      <InspectorLayout pageTitle="Tables">
        <div>Content</div>
      </InspectorLayout>,
    )

    const skipLink = screen.getByRole('link', { name: 'Skip to content' })
    const main = screen.getByRole('main')

    expect(skipLink.getAttribute('href')).toBe('#main-content')
    expect(main.getAttribute('id')).toBe('main-content')
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(screen.getByRole('heading', { level: 1, name: 'Tables' })).toBeTruthy()
    expect(skipLink.compareDocumentPosition(screen.getByRole('banner'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })
})
