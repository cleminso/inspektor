import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CodeBlock } from './codeBlock'

const { highlightedCode } = vi.hoisted(() => ({
  highlightedCode: {
    value:
      '<pre class="shiki" style="background-color:#fff;--shiki-dark-bg:#0d1117"><code><span style="color:#000;--shiki-dark:#f0f6fc">code</span></code></pre>' as
        | string
        | null,
  },
}))

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => highlightedCode.value }))

afterEach(() => {
  cleanup()
  highlightedCode.value =
    '<pre class="shiki" style="background-color:#fff;--shiki-dark-bg:#0d1117"><code><span style="color:#000;--shiki-dark:#f0f6fc">code</span></code></pre>'
})

describe('CodeBlock', () => {
  it('exposes highlighted output to the shared Shiki theme selectors', () => {
    render(<CodeBlock source="code" />)

    const region = screen.getByRole('region', { name: 'Code' })
    const heading = within(region).getByRole('heading', { level: 2, name: 'Code' })
    const trigger = within(heading).getByRole('button', { name: 'Code' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(region.getAttribute('style')).not.toContain('border')
    expect(screen.queryByRole('button', { name: 'Copy source' })).toBeNull()
    expect(document.querySelector('[data-docs-code-content]')).toBeNull()

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: 'Copy source' })).toBeTruthy()
    expect(document.querySelector('[data-docs-code-content] .shiki')).toBeTruthy()

    const panelContent = document.querySelector<HTMLElement>('[data-docs-code-panel]')
    expect(panelContent?.style.width).toBe('100%')
    expect(panelContent?.style.minWidth).toBe('0px')

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: 'Copy source' })).toBeNull()
  })

  it('keeps fallback code inside the constrained panel content', () => {
    const source = `const value = '${'x'.repeat(256)}'`
    highlightedCode.value = null
    render(<CodeBlock source={source} />)

    fireEvent.click(screen.getByRole('button', { name: 'Code' }))

    const panelContent = document.querySelector('[data-docs-code-panel]')
    const pre = panelContent?.querySelector('pre')
    expect(pre?.textContent).toBe(source)
  })
})
