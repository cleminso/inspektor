import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Tooltip } from './tooltip'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
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

  it('supports a close delay while the pointer crosses grouped triggers', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip.Provider delay={0}>
        <Tooltip.Root>
          <Tooltip.Trigger closeDelay={100}>First</Tooltip.Trigger>
          <Tooltip.Content>First tooltip</Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger closeDelay={100}>Second</Tooltip.Trigger>
          <Tooltip.Content>Second tooltip</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    )

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'First' }))
    await vi.runAllTimersAsync()
    expect(screen.getByText('First tooltip')).toBeTruthy()

    fireEvent.mouseLeave(screen.getByRole('button', { name: 'First' }))
    await vi.advanceTimersByTimeAsync(50)
    expect(screen.getByText('First tooltip')).toBeTruthy()

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Second' }))
    await vi.runAllTimersAsync()
    expect(screen.getByText('Second tooltip')).toBeTruthy()
  })
})
