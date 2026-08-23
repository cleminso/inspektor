import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ResizablePanelPlayground, serializeResizablePanelPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Resizable Panel playground', () => {
  it('serializes the initial two-panel layout', () => {
    const source = serializeResizablePanelPlayground({
      orientation: 'horizontal',
      appearance: 'line',
      disabled: false,
      collapsible: false,
    })

    expect(source).toContain('<ResizablePanel defaultSize="40%" minSize="25%">')
    expect(source).toContain('borderWidth={1} borderStyle="solid" borderColor="default"')
    expect(source).toContain('backgroundColor="element-default"')
  })

  it('updates the preview and source from the disabled control', () => {
    const { container } = render(<ResizablePanelPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show code' }))

    expect(screen.getByRole('switch', { name: 'Disabled' }).getAttribute('aria-checked')).toBe(
      'true',
    )
    expect(container.querySelector('pre')?.textContent).toContain('disabled')
  })

  it('resets the preview and source', () => {
    const { container } = render(<ResizablePanelPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Collapsible' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show code' }))

    expect(container.querySelector('pre')?.textContent).not.toContain('collapsible')
  })
})
