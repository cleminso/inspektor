import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ContextSwitcherPlayground, serializeContextSwitcherPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('ContextSwitcher playground', () => {
  it('serializes a safe representative composition', () => {
    const source = serializeContextSwitcherPlayground({
      size: 's',
      triggerWidth: 's',
      contentWidth: 's',
      maxHeight: 's',
      disabled: false,
    })

    expect(source).toContain('import { ContextSwitcher } from "@inspektor/ds";')
    expect(source).toContain('<ContextSwitcher.Trigger label="Switch branch" size="s" width="s">')
    expect(source).toContain('{(branch: string) => (')
  })

  it('omits selected public defaults', () => {
    const source = serializeContextSwitcherPlayground({
      size: 'm',
      triggerWidth: 'content',
      contentWidth: 'm',
      maxHeight: 'm',
      disabled: false,
    })

    expect(source).toContain('<ContextSwitcher.Trigger label="Switch branch">')
    expect(source).toContain('<ContextSwitcher.Content>')
    expect(source).toContain('<ContextSwitcher.Viewport>')
    expect(source).not.toContain('size="m"')
    expect(source).not.toContain('width="content"')
    expect(source).not.toContain('width="m"')
    expect(source).not.toContain('maxHeight="m"')
  })

  it('updates preview and source from one control state', () => {
    const { container } = render(<ContextSwitcherPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show code' }))

    expect(
      (screen.getByRole('combobox', { name: 'Switch branch' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(container.querySelector('pre')?.textContent).toContain('disabled')
  })
})
