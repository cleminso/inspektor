import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppShellFooter } from './appShell'

const hotkeys = vi.hoisted(
  () =>
    new Map<
      string,
      {
        handler: (event: KeyboardEvent) => void
        options: { preventDefault?: boolean; stopPropagation?: boolean }
      }
    >(),
)
const docks = vi.hoisted(() => ({
  left: vi.fn(),
  right: vi.fn(),
}))

vi.mock('@tanstack/react-hotkeys', () => ({
  useHotkey: (
    hotkey: string,
    handler: (event: KeyboardEvent) => void,
    options: { preventDefault?: boolean; stopPropagation?: boolean },
  ) => {
    hotkeys.set(hotkey, { handler, options })
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
    render(<AppShellFooter />)
    const event = new KeyboardEvent('keydown', { cancelable: true })
    const registration = hotkeys.get(hotkey)

    if (registration?.options.preventDefault !== false) {
      event.preventDefault()
    }
    registration?.handler(event)

    expect(event.defaultPrevented).toBe(true)
    expect(toggle).toHaveBeenCalledOnce()
  })
})
