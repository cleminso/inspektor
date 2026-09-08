import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ComponentDocsPage } from './componentDocsPage'
import { AppShellDetailsTargetContext } from '@/layout/appShellDetails'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))
const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ComponentDocsPage', () => {
  it('places the description and playground in the center and exposes controls in the dock', () => {
    const detailsTarget = document.createElement('div')
    render(
      <AppShellDetailsTargetContext.Provider value={detailsTarget}>
        <ComponentDocsPage
          title="Button"
          description="Action primitive"
          source={{
            label: 'button.tsx',
            path: 'packages/design-system/src/components/button/button.tsx',
          }}
          preview={<button type="button">Preview</button>}
          sourceCode={'import { Button } from "@inspektor/ds";'}
          controls={<div>Variant control</div>}
        />
      </AppShellDetailsTargetContext.Provider>,
    )

    expect(screen.getByRole('region', { name: 'Button playground' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Button' })).toBeTruthy()
    expect(screen.getByText('Action primitive')).toBeTruthy()
    expect(
      screen.getByRole('region', { name: 'Button playground' }).getAttribute('style'),
    ).not.toContain('max-width:')
    const details = within(detailsTarget).getByRole('complementary', { name: 'Button details' })
    expect(details.textContent).toContain('Variant control')
    expect(details.textContent).not.toContain('Action primitive')

    const playground = screen.getByRole('region', { name: 'Button playground' })
    const code = screen.getByRole('region', { name: 'Code' })
    expect(playground.contains(code)).toBe(false)

    const scrollArea = document.querySelector('[data-scroll-area="main-content"]')
    expect(scrollArea?.children).toHaveLength(2)
    expect(scrollArea?.children[0]).toBe(playground)
    expect(scrollArea?.children[1]).toBe(code)
    expect(playground.getAttribute('style')).not.toContain('border')
    expect(code.getAttribute('style')).not.toContain('border')
  })

  it('does not render component details for a fixed playground', () => {
    const detailsTarget = document.createElement('div')
    render(
      <AppShellDetailsTargetContext.Provider value={detailsTarget}>
        <ComponentDocsPage
          title="Badge"
          description="Status primitive"
          source={{
            label: 'badge.tsx',
            path: 'packages/design-system/src/components/badge/badge.tsx',
          }}
          preview={<span>Preview</span>}
          sourceCode={'import { Badge } from "@inspektor/ds";'}
        />
      </AppShellDetailsTargetContext.Provider>,
    )

    expect(screen.getByRole('region', { name: 'Badge playground' })).toBeTruthy()
    expect(detailsTarget.childElementCount).toBe(0)
  })

  it('keeps the toolbar outside the center scroll area', () => {
    render(
      <ComponentDocsPage
        title="Copy Button"
        description="Copy action"
        source={{
          label: 'copyButton.tsx',
          path: 'packages/design-system/src/components/copyButton/copyButton.tsx',
        }}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { CopyButton } from "@inspektor/ds";'}
        controls={<div>Controls</div>}
      />,
    )

    const toolbar = screen.getByRole('banner')
    const scrollArea = document.querySelector('[data-scroll-area="main-content"]')

    expect(scrollArea).not.toBeNull()
    expect(scrollArea?.contains(toolbar)).toBe(false)
    expect(toolbar.nextElementSibling).toBe(scrollArea)
    expect(scrollArea?.getAttribute('data-scroll-fade')).toBe('top')
    expect(scrollArea?.getAttribute('style')).toContain('width: 100%;')
    expect(
      screen.getByRole('region', { name: 'Copy Button playground' }).getAttribute('style'),
    ).toContain('min-width: 0px;')
  })

  it('navigates through component registry order', () => {
    render(
      <ComponentDocsPage
        title="Copy Button"
        description="Copy action"
        source={{
          label: 'copyButton.tsx',
          path: 'packages/design-system/src/components/copyButton/copyButton.tsx',
        }}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { CopyButton } from "@inspektor/ds";'}
        controls={<div>Controls</div>}
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
        title="Button"
        description="Action primitive"
        source={{
          label: 'button.tsx',
          path: 'packages/design-system/src/components/button/button.tsx',
        }}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { Button } from "@inspektor/ds";'}
        controls={<div>Controls</div>}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Previous page: Box' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/components/box' })

    rerender(
      <ComponentDocsPage
        title="Toggle Group"
        description="Related controls"
        source={{
          label: 'toggleGroup.tsx',
          path: 'packages/design-system/src/components/toggleGroup/toggleGroup.tsx',
        }}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { ToggleGroup } from "@inspektor/ds";'}
        controls={<div>Controls</div>}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Next page: Colors' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/foundations/colors' })
  })
})
