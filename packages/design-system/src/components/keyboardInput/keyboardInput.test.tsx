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
  })

  it('uses a stable platform snapshot during server rendering', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: 'Macintosh' })

    const html = renderToString(<KeyboardInput hotkey="Mod+K" />)

    expect(html).toContain('aria-label="Ctrl+K"')
    expect(html).toContain('Ctrl+K')
    expect(html).not.toContain('⌘')
  })
})
