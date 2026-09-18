import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Button } from '../button/button'
import { Menu } from './menu'

afterEach(cleanup)

describe('Menu', () => {
  it('composes trigger behavior onto the control that owns its presentation', () => {
    render(
      <Menu.Root>
        <Menu.Trigger
          render={<Button iconOnly aria-label="Open actions" size="xs" variant="ghost" />}
        >
          Actions
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Duplicate</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    )

    const trigger = screen.getByRole('button', { name: 'Open actions' })
    expect(trigger.getAttribute('data-size')).toBe('xs')

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-expanded')).toBe('')
  })

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
