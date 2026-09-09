import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ComponentDocsPage } from './componentDocsPage'
import { badgeItem, buttonItem, copyButtonItem, toggleGroupItem } from '@/lib/registry'
import { AppShellDetailsTargetContext } from '@/layout/appShellDetails'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))
const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ComponentDocsPage', () => {
  it('renders one scrolling page surface with the playground first and controls in the dock', () => {
    const detailsTarget = document.createElement('div')
    render(
      <AppShellDetailsTargetContext.Provider value={detailsTarget}>
        <ComponentDocsPage
          item={buttonItem}
          preview={<button type="button">Preview</button>}
          sourceCode={'import { Button } from "@inspektor/ds";'}
          controls={<div>Variant control</div>}
        />
      </AppShellDetailsTargetContext.Provider>,
    )

    const scrollArea = document.querySelector('[data-scroll-area="main-content"]')
    const header = screen.getByRole('banner')
    const playground = screen.getByRole('region', { name: 'Button playground' })
    const code = screen.getByRole('region', { name: 'Code' })

    expect(scrollArea).not.toBeNull()
    expect(scrollArea?.getAttribute('data-scrollbar')).toBe('hidden')
    expect(scrollArea?.parentElement?.getAttribute('data-scrollbar')).toBe('overlay')
    expect(scrollArea?.contains(header)).toBe(true)
    expect(scrollArea?.contains(playground)).toBe(true)
    expect(playground.contains(code)).toBe(true)
    expect(
      header.compareDocumentPosition(playground) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Button' })).toBeTruthy()
    expect(screen.getByText(buttonItem.description)).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'API Reference' })).toBeNull()

    const details = within(detailsTarget).getByRole('complementary', { name: 'Button details' })
    expect(details.textContent).toContain('Variant control')
    expect(details.textContent).not.toContain(buttonItem.description)
  })

  it('omits controls when a component has none', () => {
    const detailsTarget = document.createElement('div')
    render(
      <AppShellDetailsTargetContext.Provider value={detailsTarget}>
        <ComponentDocsPage
          item={badgeItem}
          preview={<span>Preview</span>}
          sourceCode={'import { Badge } from "@inspektor/ds";'}
        />
      </AppShellDetailsTargetContext.Provider>,
    )

    expect(screen.getByRole('region', { name: 'Badge playground' })).toBeTruthy()
    expect(detailsTarget.childElementCount).toBe(0)
  })

  it('navigates through component registry order', () => {
    render(
      <ComponentDocsPage
        item={copyButtonItem}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { CopyButton } from "@inspektor/ds";'}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Previous page: Context Switcher' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/components/context-switcher' })

    fireEvent.click(screen.getByRole('button', { name: 'Next page: Data Grid' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/components/data-grid' })
  })

  it('continues toolbar navigation across registry sections and wraps at both ends', () => {
    const { rerender } = render(
      <ComponentDocsPage
        item={buttonItem}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { Button } from "@inspektor/ds";'}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Previous page: Box' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/components/box' })

    rerender(
      <ComponentDocsPage
        item={toggleGroupItem}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { ToggleGroup } from "@inspektor/ds";'}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Next page: Colors' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/foundations/colors' })
  })
})
