import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FoundationDocsPage } from './foundationDocsPage'
import { colorsFoundationItem } from '@/lib/registry'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('FoundationDocsPage', () => {
  it('uses the shared docs header without exposing a controls pane', () => {
    render(
      <FoundationDocsPage item={colorsFoundationItem}>
        <section>Color scales</section>
      </FoundationDocsPage>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Colors' })).toBeTruthy()
    const sourceLink = screen.getByRole('link', { name: 'View Colors source on GitHub' })
    expect(sourceLink.textContent).toBe('Colors')
    expect(sourceLink.querySelector('svg')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Hide navigation' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Hide controls' })).toBeNull()
    expect(screen.getByText(colorsFoundationItem.description)).toBeTruthy()
    const scrollArea = document.querySelector('[data-scroll-area="main-content"]')
    expect(scrollArea?.textContent).toContain('Color scales')
    expect(scrollArea?.getAttribute('data-scroll-fade')).toBe('top')
  })

  it('navigates through the complete docs registry', () => {
    render(
      <FoundationDocsPage item={colorsFoundationItem}>
        <section>Color scales</section>
      </FoundationDocsPage>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Previous page: Toggle Group' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/components/toggle-group' })

    fireEvent.click(screen.getByRole('button', { name: 'Next page: Typography' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/foundations/typography' })
  })
})
