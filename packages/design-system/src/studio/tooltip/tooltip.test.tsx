import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Tooltip } from './tooltip'

afterEach(() => {
  cleanup()
})

describe('Tooltip', () => {
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

  it('uses its non-hoverable, arrowless popup defaults', async () => {
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
    expect(popup?.parentElement?.style.pointerEvents).toBe('none')
  })
})
