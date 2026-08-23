import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'

import { Button } from '../button/button'
import { buttonStyles } from '../button/button.styles'
import { Menu } from './menu'
import { menuStyles } from './menu.styles'

afterEach(cleanup)

describe('Menu', () => {
  it('keeps trigger presentation on the component that owns the composed control', () => {
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
    const menuTriggerClassName = stylex.props(menuStyles.trigger).className
    const buttonClassNames = new Set(
      stylex
        .props(
          buttonStyles.base,
          buttonStyles.sizeXS,
          buttonStyles.square,
          buttonStyles.ghost,
          buttonStyles.radiusXS,
        )
        .className?.split(' ') ?? [],
    )
    const menuOnlyClassNames =
      menuTriggerClassName
        ?.split(' ')
        .filter((className) => buttonClassNames.has(className) === false) ?? []

    expect(menuTriggerClassName).toBeDefined()
    expect(menuOnlyClassNames.length).toBeGreaterThan(0)
    for (const className of menuOnlyClassNames) {
      expect(trigger.classList.contains(className)).toBe(false)
    }
    expect(trigger.getAttribute('data-size')).toBe('xs')

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-expanded')).toBe('')
  })

  it('keeps Menu presentation on an uncomposed trigger', () => {
    render(
      <Menu.Root>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Duplicate</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    )

    const trigger = screen.getByRole('button', { name: 'Actions' })
    const menuTriggerClassNames = stylex.props(menuStyles.trigger).className?.split(' ') ?? []

    expect(menuTriggerClassNames.length).toBeGreaterThan(0)
    for (const className of menuTriggerClassNames) {
      expect(trigger.classList.contains(className)).toBe(true)
    }
  })

  it('uses the standard treatment on its bounded popup', () => {
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Duplicate</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    )

    expect(screen.getByRole('menu').getAttribute('data-scrollbar')).toBe('standard')
  })

  it('composes content and closes action items after activation', () => {
    const onClick = vi.fn()
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item onClick={onClick}>Duplicate</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    )

    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }))

    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('suppresses disabled actions', () => {
    const onClick = vi.fn()
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item disabled onClick={onClick}>
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    )

    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeTruthy()
  })

  it('renders link items with prefix and suffix presentation', () => {
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.LinkItem
            href="/settings"
            closeOnClick={false}
            onClick={(event) => event.preventDefault()}
          >
            <Menu.Prefix>Icon</Menu.Prefix>
            Settings
            <Menu.Suffix>External</Menu.Suffix>
          </Menu.LinkItem>
        </Menu.Content>
      </Menu.Root>,
    )

    const link = screen.getByRole('menuitem', { name: 'Settings' })
    expect(link.getAttribute('href')).toBe('/settings')
    expect(link.querySelectorAll("[data-slot^='menu-']")).toHaveLength(2)

    fireEvent.click(link)
    expect(screen.getByRole('menu')).toBeTruthy()
  })

  it('preserves native props and refs on presentation parts', () => {
    const prefixRef = createRef<HTMLSpanElement>()

    render(
      <Menu.Prefix ref={prefixRef} slot="leading">
        Icon
      </Menu.Prefix>,
    )

    expect(prefixRef.current?.getAttribute('data-slot')).toBe('menu-prefix')
    expect(prefixRef.current?.getAttribute('slot')).toBe('leading')
  })

  it('keeps checkbox and radio choices open unless closeOnClick is requested', () => {
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>View</Menu.Trigger>
        <Menu.Content>
          <Menu.CheckboxItem defaultChecked={false}>Grid</Menu.CheckboxItem>
          <Menu.RadioGroup defaultValue="comfortable">
            <Menu.RadioItem value="compact" closeOnClick>
              Compact
              <Menu.RadioItemIndicator />
            </Menu.RadioItem>
            <Menu.RadioItem value="comfortable">Comfortable</Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Root>,
    )

    const checkbox = screen.getByRole('menuitemcheckbox', { name: 'Grid' })
    fireEvent.click(checkbox)
    expect(checkbox.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('menu')).toBeTruthy()

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Compact' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('highlights a keyboard shortcut with its menu item', () => {
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

    const item = screen.getByRole('menuitem', { name: /Move left/ })
    const shortcut = screen.getByLabelText('Shift+ArrowLeft')
    const restingItemClassName = item.className

    fireEvent.mouseMove(item)

    expect(item.className).not.toBe(restingItemClassName)
    expect(shortcut.getAttribute('data-variant')).toBe('default')
    expect(shortcut.getAttribute('data-size')).toBe('small')
  })
})
