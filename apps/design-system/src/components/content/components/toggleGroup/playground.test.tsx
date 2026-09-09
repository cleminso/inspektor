import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { serializeToggleGroupPlayground, ToggleGroupPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('Toggle Group playground', () => {
  it('serializes the initial controlled view switcher', () => {
    expect(
      serializeToggleGroupPlayground({
        orientation: 'horizontal',
        size: 'l',
        width: 'content',
        itemWidth: 'content',
        multiple: false,
        disabled: false,
        loopFocus: true,
      }),
    ).toContain('defaultValue={["tables"]}')
  })

  it('serializes the compact size', () => {
    expect(
      serializeToggleGroupPlayground({
        orientation: 'horizontal',
        size: 's',
        width: 'content',
        itemWidth: 'content',
        multiple: false,
        disabled: false,
        loopFocus: true,
      }),
    ).toContain('size="s"')
  })

  it('updates the preview and source from the disabled control', () => {
    const { container } = render(<ToggleGroupPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show Code' }))

    expect((screen.getByRole('button', { name: 'Tables' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    expect(container.querySelector('pre')?.textContent).toContain('disabled')
  })

  it('preserves user selection when a cosmetic control changes', () => {
    render(<ToggleGroupPlayground />)

    fireEvent.click(screen.getByRole('button', { name: 'Subscriptions' }))
    expect(screen.getByRole('button', { name: 'Subscriptions' }).getAttribute('aria-pressed')).toBe(
      'true',
    )

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))

    expect(screen.getByRole('button', { name: 'Subscriptions' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
  })

  it('resets the preview and source', () => {
    const { container } = render(<ToggleGroupPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Multiple' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show Code' }))

    expect(container.querySelector('pre')?.textContent).not.toContain('multiple')
  })
})
