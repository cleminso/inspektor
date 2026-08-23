import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { KeyboardInputPlayground, serializeKeyboardInputPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('KeyboardInput playground', () => {
  it('serializes a platform-specific outlined shortcut', () => {
    expect(
      serializeKeyboardInputPlayground({
        hotkey: 'Mod+Shift+K',
        platform: 'mac',
        size: 'default',
        variant: 'outline',
      }),
    ).toContain('<KeyboardInput hotkey="Mod+Shift+K" platform="mac" variant="outline" />')
  })

  it('serializes Backspace', () => {
    expect(
      serializeKeyboardInputPlayground({
        hotkey: 'Backspace',
        platform: 'auto',
        size: 'default',
        variant: 'default',
      }),
    ).toContain('<KeyboardInput hotkey="Backspace" />')
  })

  it('renders the default keycap and generated source', () => {
    const { container } = render(<KeyboardInputPlayground />)

    fireEvent.click(screen.getByRole('button', { name: 'Show code' }))

    expect(screen.getByLabelText('Ctrl+K')).toBeTruthy()
    expect(container.querySelector('pre')?.textContent).toContain('hotkey="Mod+K"')
  })
})
