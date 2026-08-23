import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { serializeSwitchPlayground, SwitchPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('Switch playground', () => {
  it('omits package defaults from the initial source', () => {
    expect(
      serializeSwitchPlayground({ size: 'm', checked: false, disabled: false, readOnly: false }),
    ).toBe(
      'import { Switch } from "@inspector/ds";\n\nexport default function Example() {\n  return <Switch aria-label="Notifications" />;\n}',
    )
  })

  it('uses one state for the preview and source, then resets it', () => {
    const { container } = render(<SwitchPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Checked' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show code' }))
    expect(screen.getByRole('switch', { name: 'Notifications' }).getAttribute('aria-checked')).toBe(
      'true',
    )
    expect(container.querySelector('pre')?.textContent).toContain('checked')

    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))
    expect(screen.getByRole('switch', { name: 'Notifications' }).getAttribute('aria-checked')).toBe(
      'false',
    )
    expect(container.querySelector('pre')?.textContent).not.toContain('checked')
  })
})
