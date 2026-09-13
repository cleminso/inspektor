import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ActionList } from './actionList'
import { Menu } from '../menu/menu'

afterEach(cleanup)

describe('ActionList', () => {
  it('exposes list-wide selection control visibility', () => {
    const { rerender } = render(<ActionList aria-label="Accounts" selectionControlsVisible />)

    expect(
      screen
        .getByRole('list', { name: 'Accounts' })
        .hasAttribute('data-selection-controls-visible'),
    ).toBe(true)

    rerender(<ActionList aria-label="Accounts" />)

    expect(
      screen
        .getByRole('list', { name: 'Accounts' })
        .hasAttribute('data-selection-controls-visible'),
    ).toBe(false)
  })

  it('keeps selection and trailing actions separate from the primary trigger', () => {
    const onCheckedChange = vi.fn()

    render(
      <ActionList>
        <ActionList.Item checked>
          <ActionList.SelectionControl
            aria-label="Select accounts"
            checked={false}
            icon="Icon"
            onCheckedChange={onCheckedChange}
          />
          <ActionList.Trigger>accounts</ActionList.Trigger>
          <ActionList.Action aria-label="Open account actions">Actions</ActionList.Action>
        </ActionList.Item>
      </ActionList>,
    )

    const checkbox = screen.getByRole('checkbox', { name: 'Select accounts' })
    const trigger = screen.getByRole('button', { name: 'accounts' })
    const action = screen.getByRole('button', { name: 'Open account actions' })

    expect(trigger.contains(checkbox)).toBe(false)
    expect(trigger.contains(action)).toBe(false)
    expect(trigger.closest('[data-slot="action-list-item"]')?.hasAttribute('data-checked')).toBe(
      true,
    )

    fireEvent.click(checkbox)
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('retains the trailing action open state while its menu is portaled', () => {
    render(
      <ActionList>
        <ActionList.Item>
          <ActionList.Trigger>accounts</ActionList.Trigger>
          <Menu.Root>
            <Menu.Trigger render={<ActionList.Action aria-label="Open account actions" />}>
              Actions
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item>Open</Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </ActionList.Item>
      </ActionList>,
    )

    const action = screen.getByRole('button', { name: 'Open account actions' })
    fireEvent.click(action)

    expect(action.hasAttribute('data-popup-open')).toBe(true)
    expect(screen.getByRole('menuitem', { name: 'Open' })).toBeTruthy()
  })

  it('preserves list semantics when its trigger is composed onto a button', () => {
    render(
      <ActionList aria-label="Accounts">
        <ActionList.Item>
          <ActionList.Trigger render={<button type="button" data-composed="" />}>
            accounts
          </ActionList.Trigger>
        </ActionList.Item>
      </ActionList>,
    )

    const list = screen.getByRole('list', { name: 'Accounts' })
    const trigger = screen.getByRole('button', { name: 'accounts' })

    expect(trigger.getAttribute('data-composed')).toBe('')
    expect(list.contains(trigger)).toBe(true)
  })

  it.each([
    {
      consumerPrevents: false,
      descendantPrevents: false,
      expectedCalls: 1,
      fromSelectionControl: false,
      name: 'delegated',
    },
    {
      consumerPrevents: false,
      descendantPrevents: true,
      expectedCalls: 0,
      fromSelectionControl: false,
      name: 'descendant-prevented',
    },
    {
      consumerPrevents: true,
      descendantPrevents: false,
      expectedCalls: 1,
      fromSelectionControl: true,
      name: 'consumer-handled',
    },
  ])(
    'applies the $name Escape policy',
    ({ consumerPrevents, descendantPrevents, expectedCalls, fromSelectionControl }) => {
      const onEscapeKeyDown = vi.fn()

      render(
        <ActionList
          onEscapeKeyDown={(event) => {
            onEscapeKeyDown()
            if (consumerPrevents === true) {
              event.preventDefault()
            }
          }}
        >
          <ActionList.Item>
            {fromSelectionControl === true ? (
              <ActionList.SelectionControl aria-label="Select accounts" checked icon="Icon" />
            ) : null}
            <ActionList.Trigger
              onKeyDown={(event) => {
                if (descendantPrevents === true) {
                  event.preventDefault()
                }
              }}
            >
              accounts
            </ActionList.Trigger>
          </ActionList.Item>
        </ActionList>,
      )

      const trigger = screen.getByRole('button', { name: 'accounts' })
      const target =
        fromSelectionControl === true
          ? screen.getByRole('checkbox', { name: 'Select accounts' })
          : trigger
      target.focus()
      fireEvent.keyDown(target, { key: 'Escape' })

      expect(onEscapeKeyDown).toHaveBeenCalledTimes(expectedCalls)
      expect(document.activeElement).toBe(trigger)
    },
  )
})
