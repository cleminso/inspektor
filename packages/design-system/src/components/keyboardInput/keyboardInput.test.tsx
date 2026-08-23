import { cleanup, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { KeyboardInput } from './keyboardInput'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('KeyboardInput', () => {
  it('formats a shortcut with macOS conventions', () => {
    render(<KeyboardInput hotkey="Mod+Alt+Shift+K" platform="mac" />)

    const shortcut = screen.getByLabelText('Cmd+Option+Shift+K')

    expect(shortcut.tagName).toBe('KBD')
    expect(shortcut.textContent).toBe('⌘ ⌥ ⇧ K')
    expect(shortcut.getAttribute('data-slot')).toBe('keyboard-input')
  })

  it('formats Mod as Control on Windows', () => {
    render(<KeyboardInput hotkey="Mod+Shift+K" platform="windows" />)

    expect(screen.getByLabelText('Ctrl+Shift+K').textContent).toBe('Ctrl+Shift+K')
  })

  it('uses automatic platform detection by default', () => {
    render(<KeyboardInput hotkey="Escape" />)

    expect(screen.getByLabelText('Escape').getAttribute('data-platform')).toBe('auto')
  })

  it('uses a stable platform snapshot during server rendering', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: 'Macintosh' })

    const html = renderToString(<KeyboardInput hotkey="Mod+K" />)

    expect(html).toContain('aria-label="Ctrl+K"')
    expect(html).toContain('Ctrl+K')
    expect(html).not.toContain('⌘')
  })

  it('formats Backspace as a platform key glyph', () => {
    render(<KeyboardInput hotkey="Backspace" platform="mac" />)

    expect(screen.getByLabelText('Backspace').textContent).toBe('⌫')
  })

  it('exposes the selected visual variant', () => {
    render(<KeyboardInput hotkey="Enter" variant="outline" />)

    expect(screen.getByLabelText('Enter').getAttribute('data-variant')).toBe('outline')
  })
})
