import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InspectorDock } from './view'

afterEach(cleanup)

function renderDock(
  leftDock?: React.ComponentProps<typeof InspectorDock>['leftDock'],
  onOpenCommands = () => undefined,
): void {
  render(<InspectorDock leftDock={leftDock} onOpenCommands={onOpenCommands} />)
}

describe('InspectorDock', () => {
  it('gives the subscriptions control an accessible name', () => {
    renderDock({ isOpen: false, onToggle: () => undefined })

    expect(screen.getByRole('button', { name: 'Open subscriptions dock' })).toBeTruthy()
  })

  it('opens and closes the left dock from one button', () => {
    function DockHarness(): React.ReactElement {
      const [isOpen, setIsOpen] = useState(false)

      return (
        <InspectorDock
          leftDock={{
            isOpen,
            onToggle: () => setIsOpen((currentIsOpen) => currentIsOpen === false),
          }}
          onOpenCommands={() => undefined}
        />
      )
    }

    render(<DockHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Open left dock' }))

    const closeButton = screen.getByRole('button', { name: 'Close left dock' })
    expect(closeButton.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(closeButton)

    expect(
      screen.getByRole('button', { name: 'Open left dock' }).getAttribute('aria-pressed'),
    ).toBe('false')
  })

  it('shows the table navigator hotkey in the left dock tooltip', async () => {
    renderDock({ isOpen: false, onToggle: () => undefined })

    const button = screen.getByRole('button', { name: 'Open left dock' })
    fireEvent.mouseEnter(button)
    fireEvent.mouseMove(button)

    expect(await screen.findByText('Open left dock')).toBeTruthy()
    expect(screen.getByLabelText('Ctrl+B')).toBeTruthy()
  })

  it('opens the command palette from the command action', () => {
    const onOpenCommands = vi.fn()
    renderDock({ isOpen: false, onToggle: () => undefined }, onOpenCommands)

    fireEvent.click(screen.getByRole('button', { name: 'Open commands' }))

    expect(onOpenCommands).toHaveBeenCalledOnce()
  })
})
