import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Menu } from './menu'

afterEach(cleanup)

describe('Menu', () => {
  it('owns its bounded popup and item presentation', () => {
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.LinkItem href="/settings">
            <Menu.Prefix>Icon</Menu.Prefix>
            Settings
            <Menu.Suffix>External</Menu.Suffix>
          </Menu.LinkItem>
        </Menu.Content>
      </Menu.Root>,
    )

    expect(screen.getByRole('menu').getAttribute('data-scrollbar')).toBe('standard')
    const link = screen.getByRole('menuitem', { name: 'Settings' })
    expect(link.querySelectorAll("[data-slot^='menu-']")).toHaveLength(2)
  })

  it('uses the constrained keyboard shortcut presentation', () => {
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item>
            Move left
            <Menu.Shortcut hotkey="Shift+ArrowLeft" />
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    )

    const shortcut = screen.getByLabelText('Shift+ArrowLeft')

    expect(shortcut.getAttribute('data-variant')).toBe('default')
    expect(shortcut.getAttribute('data-size')).toBe('small')
  })
})
