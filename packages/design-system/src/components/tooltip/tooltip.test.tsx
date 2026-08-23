import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { afterEach, describe, expect, it } from 'vitest'

import { KeyboardInput } from '../keyboardInput/keyboardInput'
import { Tooltip } from './tooltip'
import { tooltipStyles } from './tooltip.styles'

afterEach(cleanup)

describe('Tooltip', () => {
  it('preserves root-derived disabled state on its trigger', () => {
    render(
      <Tooltip.Root disabled>
        <Tooltip.Trigger>Trigger</Tooltip.Trigger>
      </Tooltip.Root>,
    )

    expect(
      screen.getByRole('button', { name: 'Trigger' }).getAttribute('data-trigger-disabled'),
    ).toBe('')
  })

  it('does not apply transition start styles during an instant focus open', async () => {
    render(
      <Tooltip.Provider delay={0}>
        <Tooltip.Root>
          <Tooltip.Trigger>Trigger</Tooltip.Trigger>
          <Tooltip.Content>Tooltip content</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    )

    fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }))

    const popup = (await screen.findByText('Tooltip content')).closest(
      '[data-slot="tooltip-content"]',
    )

    expect(popup?.className).not.toContain(stylex.props(tooltipStyles.popupTransition).className)
  })

  it('preserves a composed Base UI trigger state class when the tooltip opens', async () => {
    render(
      <Tooltip.Provider delay={0}>
        <BaseTabs.Root defaultValue="accounts">
          <BaseTabs.List>
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
                  <BaseTabs.Tab value="accounts" className={() => 'composed-trigger-state'}>
                    Accounts
                  </BaseTabs.Tab>
                }
              />
              <Tooltip.Content>Account details</Tooltip.Content>
            </Tooltip.Root>
          </BaseTabs.List>
        </BaseTabs.Root>
      </Tooltip.Provider>,
    )

    fireEvent.mouseEnter(screen.getByRole('tab', { name: 'Accounts' }))
    await screen.findByText('Account details')

    expect(screen.getByRole('tab', { name: 'Accounts' }).className).toBe('composed-trigger-state')
  })

  it('renders without an arrow indicator', async () => {
    render(
      <Tooltip.Provider delay={0}>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger id="trigger">Trigger</Tooltip.Trigger>
          <Tooltip.Content>Tooltip content</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    )

    const popup = (await screen.findByText('Tooltip content')).closest(
      '[data-slot="tooltip-content"]',
    )

    expect(popup?.querySelector('svg[aria-hidden="true"]')).toBeNull()
  })

  it('makes its visual-label popup non-hoverable by default', async () => {
    render(
      <Tooltip.Provider delay={0}>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Trigger</Tooltip.Trigger>
          <Tooltip.Content>Tooltip content</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    )

    const popup = (await screen.findByText('Tooltip content')).closest(
      '[data-slot="tooltip-content"]',
    )

    expect(popup?.parentElement?.style.pointerEvents).toBe('none')
  })

  it('provides inverse context styling to nested keyboard input', async () => {
    render(
      <Tooltip.Provider delay={0}>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Trigger</Tooltip.Trigger>
          <Tooltip.Content>
            Close view <KeyboardInput hotkey="W" size="small" />
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    )

    const popup = (await screen.findByLabelText('W')).closest('[data-slot="tooltip-content"]')
    expect(popup?.className).toContain(stylex.props(tooltipStyles.keyboardInputContext).className)
  })
})
