import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ActionList } from './actionList'
import { actionListStyles } from './actionList.styles'
import { ContextMenu } from '../contextMenu/contextMenu'

const normalizationContractStyles = stylex.create({
  root: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  trigger: {
    margin: 0,
    paddingBlock: 0,
    textDecoration: 'none',
  },
})

function expectStyleClasses(element: Element, className: string | undefined) {
  for (const atomicClassName of className?.split(' ') ?? []) {
    expect(element.className).toContain(atomicClassName)
  }
}

afterEach(cleanup)

describe('ActionList', () => {
  it('keeps the primary trigger separate from the trailing action', () => {
    render(
      <ActionList>
        <ActionList.Item active>
          <ActionList.Trigger prefix="Icon">accounts</ActionList.Trigger>
          <ActionList.Action aria-label="Open account actions">Actions</ActionList.Action>
        </ActionList.Item>
      </ActionList>,
    )

    expect(screen.getByRole('button', { name: 'accounts' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open account actions' })).toBeTruthy()
  })

  it('keeps bulk selection separate from the primary trigger', () => {
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
        </ActionList.Item>
      </ActionList>,
    )

    const checkbox = screen.getByRole('checkbox', { name: 'Select accounts' })
    const trigger = screen.getByRole('button', { name: 'accounts' })

    expect(trigger.contains(checkbox)).toBe(false)
    expect(trigger.closest('[data-slot="action-list-item"]')?.hasAttribute('data-checked')).toBe(true)

    fireEvent.click(checkbox)
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('preserves item semantics when context-menu behavior is composed onto the item', () => {
    render(
      <ActionList>
        <ContextMenu.Root>
          <ContextMenu.Trigger render={<ActionList.Item />}>
            <ActionList.Trigger>accounts</ActionList.Trigger>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Open</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </ActionList>,
    )

    expect(screen.getByRole('button', { name: 'accounts' }).closest('[data-slot="action-list-item"]')).toBeTruthy()
  })

  it('normalizes native list and composed link presentation', () => {
    render(
      <ActionList aria-label="Accounts">
        <ActionList.Item>
          <ActionList.Trigger nativeButton={false} render={<a href="/accounts" />}>
            accounts
          </ActionList.Trigger>
        </ActionList.Item>
      </ActionList>,
    )

    const list = screen.getByRole('list', { name: 'Accounts' })
    const link = screen.getByRole('button', { name: 'accounts' })

    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/accounts')
    expectStyleClasses(list, stylex.props(normalizationContractStyles.root).className)
    expectStyleClasses(link, stylex.props(normalizationContractStyles.trigger).className)
    expectStyleClasses(link, stylex.props(actionListStyles.trigger).className)
  })

  it('delegates Escape from a descendant to the consumer', () => {
    const onEscapeKeyDown = vi.fn()

    render(
      <ActionList onEscapeKeyDown={onEscapeKeyDown}>
        <ActionList.Item>
          <ActionList.Trigger>accounts</ActionList.Trigger>
        </ActionList.Item>
      </ActionList>,
    )

    fireEvent.keyDown(screen.getByRole('button', { name: 'accounts' }), { key: 'Escape' })

    expect(onEscapeKeyDown).toHaveBeenCalledOnce()
  })

  it('ignores Escape prevented by a descendant', () => {
    const onEscapeKeyDown = vi.fn()

    render(
      <ActionList onEscapeKeyDown={onEscapeKeyDown}>
        <ActionList.Item>
          <ActionList.Trigger onKeyDown={(event) => event.preventDefault()}>
            accounts
          </ActionList.Trigger>
        </ActionList.Item>
      </ActionList>,
    )

    fireEvent.keyDown(screen.getByRole('button', { name: 'accounts' }), { key: 'Escape' })

    expect(onEscapeKeyDown).not.toHaveBeenCalled()
  })

  it('moves focus to the item trigger after Escape is handled', () => {
    render(
      <ActionList onEscapeKeyDown={(event) => event.preventDefault()}>
        <ActionList.Item>
          <ActionList.SelectionControl
            aria-label="Select accounts"
            checked
            icon="Icon"
          />
          <ActionList.Trigger>accounts</ActionList.Trigger>
        </ActionList.Item>
      </ActionList>,
    )

    const checkbox = screen.getByRole('checkbox', { name: 'Select accounts' })
    const trigger = screen.getByRole('button', { name: 'accounts' })
    checkbox.focus()

    fireEvent.keyDown(checkbox, { key: 'Escape' })

    expect(document.activeElement).toBe(trigger)
  })
})
