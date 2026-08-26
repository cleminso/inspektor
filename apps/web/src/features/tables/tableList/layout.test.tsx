import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SidePanelLayout, SidePanelLayoutProvider, useSidePanelLayout } from './layout'

beforeEach(() => {
  const values = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
})

afterEach(() => {
  cleanup()
})

function renderLayout(sibling?: React.ReactNode): ReturnType<typeof render> {
  return render(
    <SidePanelLayoutProvider>
      {sibling}
      <SidePanelLayout>
        <SidePanelLayout.Panel>Panel</SidePanelLayout.Panel>
        <SidePanelLayout.Content>Content</SidePanelLayout.Content>
      </SidePanelLayout>
    </SidePanelLayoutProvider>,
  )
}

describe('SidePanelLayout', () => {
  it('falls back to the open layout when storage is unavailable', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('Unavailable')
      },
    })

    renderLayout()

    expect(screen.getByRole('separator')).toBeTruthy()
  })

  it('falls back to the open layout when persisted storage is malformed', () => {
    window.localStorage.setItem('react-resizable-panels:tables-side-panel', 'not-json')

    renderLayout()

    expect(screen.getByRole('separator')).toBeTruthy()
  })

  it.each([
    ['a missing panel', JSON.stringify({ navigation: 0 })],
    ['zero total size', JSON.stringify({ content: 0, navigation: 0 })],
    ['a negative size', JSON.stringify({ content: 110, navigation: -10 })],
    ['a non-finite size', '{"content":1e309,"navigation":1}'],
    ['an overflowing total size', '{"content":1e308,"navigation":1e308}'],
  ])('falls back to the open layout for %s', (_case, value) => {
    window.localStorage.setItem('react-resizable-panels:tables-side-panel', value)

    renderLayout()

    expect(screen.getByRole('separator')).toBeTruthy()
  })

  it('restores the persisted table-list dock layout across remounts', () => {
    const storageKey = 'react-resizable-panels:tables-side-panel'
    window.localStorage.setItem(storageKey, JSON.stringify({ content: 100, navigation: 0 }))
    const view = renderLayout()

    expect(screen.getByText('Panel').closest('[data-panel]')?.id).toBe('navigation')
    expect(screen.queryByRole('separator')).toBeNull()

    view.unmount()
    renderLayout()

    expect(screen.queryByRole('separator')).toBeNull()
    expect(window.localStorage.getItem(storageKey)).toBe(
      JSON.stringify({ content: 100, navigation: 0 }),
    )
  })

  it('starts open and toggles from a control outside the resizable layout', () => {
    function DockToggle(): React.ReactElement {
      const { isOpen, toggle } = useSidePanelLayout()

      return (
        <button type="button" aria-pressed={isOpen} onClick={toggle}>
          Toggle left dock
        </button>
      )
    }

    renderLayout(<DockToggle />)

    const toggle = screen.getByRole('button', { name: 'Toggle left dock' })
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('separator')).toBeTruthy()

    fireEvent.click(toggle)

    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByRole('separator')).toBeNull()

    fireEvent.click(toggle)

    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('separator')).toBeTruthy()
  })
})
