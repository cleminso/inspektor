import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ComponentDemo } from './componentDemo'

const shikiMock = vi.hoisted(() => ({ html: null as string | null }))

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => shikiMock.html }))

describe('ComponentDemo', () => {
  beforeEach(() => {
    shikiMock.html = null
  })

  it('reveals and hides copyable source', () => {
    const source = '\nexport default function Example() {\n  return null\n}\n'

    render(
      <ComponentDemo source={source}>
        <button type="button">Example action</button>
      </ComponentDemo>,
    )

    expect(screen.getByRole('button', { name: 'Example action' })).toBeTruthy()

    const toggle = screen.getByRole('button', { name: 'Show code' })
    const sourcePanelId = toggle.getAttribute('aria-controls')

    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(sourcePanelId).toBeTruthy()
    expect(document.getElementById(sourcePanelId ?? '')?.hidden).toBe(true)
    expect(screen.queryByLabelText('Source code')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Copy source' })).toBeNull()

    toggle.focus()
    fireEvent.click(toggle)

    expect(screen.getByRole('button', { name: 'Hide code' })).toBe(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(toggle).toBe(document.activeElement)
    const sourceRegion = screen.getByRole('region', { name: 'Source code' })

    expect(sourceRegion.textContent).toBe(source)
    expect(screen.getByRole('button', { name: 'Copy source' })).toBeTruthy()
    expect(sourceRegion.getAttribute('tabindex')).toBe('0')

    fireEvent.click(toggle)

    expect(screen.getByRole('button', { name: 'Show code' })).toBe(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByLabelText('Source code')).toBeNull()
  })

  it('keeps highlighted line numbers out of the accessibility tree', () => {
    shikiMock.html =
      '<pre class="shiki"><code><span class="line">first</span>\n<span class="line">second</span>\n<span class="line"></span></code></pre>'

    const { container } = render(
      <ComponentDemo source={'first\nsecond\n'}>
        <span>Example</span>
      </ComponentDemo>,
    )

    fireEvent.click(within(container).getByRole('button', { name: 'Show code' }))

    const lineNumbers = container.querySelector('[data-docs-code-line-numbers]')
    const sourceCode = screen.getByLabelText('Source code')
    const highlightedContent = container.querySelector('[data-docs-code-content]')
    const copyButton = screen.getByRole('button', { name: 'Copy source' })

    expect(lineNumbers?.getAttribute('aria-hidden')).toBe('true')
    expect(Array.from(lineNumbers?.children ?? []).map((line) => line.textContent)).toEqual([
      '1',
      '2',
      '3',
    ])
    expect(sourceCode.contains(lineNumbers)).toBe(true)
    expect(sourceCode.contains(highlightedContent)).toBe(true)
    expect(sourceCode.contains(copyButton)).toBe(false)
    expect(sourceCode.getAttribute('tabindex')).toBe('0')
    expect(sourceCode.querySelector('pre')?.getAttribute('tabindex')).toBeNull()
  })

  it('matches Shiki line splitting for lone carriage returns', () => {
    shikiMock.html = '<pre class="shiki"><code><span class="line">first\rsecond</span></code></pre>'

    const { container } = render(
      <ComponentDemo source={'first\rsecond'}>
        <span>Example</span>
      </ComponentDemo>,
    )

    fireEvent.click(within(container).getByRole('button', { name: 'Show code' }))

    expect(container.querySelector('[data-docs-code-line-numbers]')?.children).toHaveLength(1)
  })
})
