import { DirectionProvider } from '@base-ui/react/direction-provider'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { afterEach, describe, expect, it } from 'vitest'

import { Tooltip } from './tooltip'
import { tooltipStyles } from './tooltip.styles'

afterEach(cleanup)

describe('Tooltip', () => {
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

  it('maps logical inline-start arrow placement to the physical RTL side', async () => {
    render(
      <DirectionProvider direction="rtl">
        <Tooltip.Provider delay={0}>
          <Tooltip.Root defaultOpen>
            <Tooltip.Trigger id="trigger">Trigger</Tooltip.Trigger>
            <Tooltip.Content side="inline-start">Tooltip content</Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </DirectionProvider>,
    )

    const popup = (await screen.findByText('Tooltip content')).closest(
      '[data-slot="tooltip-content"]',
    )
    const arrow = popup?.querySelector('div[aria-hidden="true"]')

    expect(arrow?.className).toContain(stylex.props(tooltipStyles.arrowRight).className)
    expect(arrow?.className).not.toContain(stylex.props(tooltipStyles.arrowLeft).className)
  })
})
