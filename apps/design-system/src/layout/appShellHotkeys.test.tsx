import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppShellDockHotkeys } from './appShell'

const hotkeys = vi.hoisted(() => new Map<string, (event: KeyboardEvent) => void>())
const docks = vi.hoisted(() => ({
  left: vi.fn(),
  right: vi.fn(),
}))

vi.mock('@tanstack/react-hotkeys', () => ({
  useHotkey: (hotkey: string, handler: (event: KeyboardEvent) => void) => {
    hotkeys.set(hotkey, handler)
  },
}))

vi.mock('@inspektor/ds', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inspektor/ds')>()),
  useShellLayout: () => ({
    leftDock: { isOpen: true, toggle: docks.left },
    rightDock: { isOpen: true, toggle: docks.right },
  }),
}))

afterEach(() => {
  hotkeys.clear()
  vi.clearAllMocks()
})

describe('AppShellDockHotkeys', () => {
  it.each([
    ['Alt+B', docks.left],
    ['Alt+D', docks.right],
  ])('toggles its dock with %s', (hotkey, toggle) => {
    render(<AppShellDockHotkeys />)
    const event = new KeyboardEvent('keydown', { cancelable: true })

    hotkeys.get(hotkey)?.(event)

    expect(event.defaultPrevented).toBe(true)
    expect(toggle).toHaveBeenCalledOnce()
  })
})
