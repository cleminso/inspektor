import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SelectPlayground, serializeSelectPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('Select playground', () => {
  it('serializes a constrained Select composition without default props', () => {
    const source = serializeSelectPlayground({
      size: 'l',
      width: 'content',
      disabled: false,
    })

    expect(source).toContain('<Select.Root items={options} defaultValue="main">')
    expect(source).toContain('<Select.Trigger aria-label="Branch" placeholder="Select a branch" />')
    expect(source).not.toContain('size="l"')
    expect(source).not.toContain('width="content"')
  })

  it('updates preview and source together, then resets both', () => {
    const { container } = render(<SelectPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show Code' }))

    expect(
      (container.querySelector('[data-slot="select-trigger"]') as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(container.querySelector('pre')?.textContent).toContain('disabled')

    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))

    expect(
      (container.querySelector('[data-slot="select-trigger"]') as HTMLButtonElement).disabled,
    ).toBe(false)
    expect(container.querySelector('pre')?.textContent).not.toContain('disabled')
  })
})
