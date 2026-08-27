import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ContextSwitcher } from './contextSwitcher'

interface ContextValue {
  id: string
  label: string
}

const contexts: ContextValue[] = [
  { id: 'main', label: 'Main' },
  { id: 'preview', label: 'Preview' },
]

function Switcher({
  defaultOpen = false,
  hasDefaultValue = true,
  onOpenChange,
}: {
  defaultOpen?: boolean
  hasDefaultValue?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <ContextSwitcher.Root
      items={contexts}
      defaultValue={hasDefaultValue === true ? contexts[0] : null}
      defaultOpen={defaultOpen}
      onOpenChange={(open) => onOpenChange?.(open)}
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(item, value) => item.id === value.id}
    >
      <ContextSwitcher.Trigger label="Switch context">
        <ContextSwitcher.Value />
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Content keepMounted>
        <ContextSwitcher.Search label="Find context" />
        <ContextSwitcher.Viewport>
          <ContextSwitcher.Empty>No contexts found.</ContextSwitcher.Empty>
          <ContextSwitcher.Status>Results ready.</ContextSwitcher.Status>
          <ContextSwitcher.List>
            {(item: ContextValue) => (
              <ContextSwitcher.Item key={item.id} value={item}>
                <ContextSwitcher.ItemText label={item.label} description={item.id} />
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Viewport>
        <ContextSwitcher.Footer>Manage contexts</ContextSwitcher.Footer>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  )
}

afterEach(cleanup)

describe('ContextSwitcher', () => {
  it('resets the query after the popup finishes closing', async () => {
    const queryWhenClosing: string[] = []
    render(
      <Switcher
        onOpenChange={(open) => {
          if (open === false) {
            const query = screen.getByRole('combobox', { name: 'Find context' }) as HTMLInputElement
            queryWhenClosing.push(query.value)
          }
        }}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Switch context' })

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const input = screen.getByRole('combobox', { name: 'Find context' }) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'pre' } })
    expect(input.value).toBe('pre')

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(queryWhenClosing).toEqual(['pre'])
    await waitFor(() => expect(input.value).toBe(''))
  })

  it('auto-highlights only after the user enters a non-empty query', () => {
    render(<Switcher defaultOpen hasDefaultValue={false} />)

    expect(document.querySelector('[data-highlighted=""]')).toBe(null)

    fireEvent.input(screen.getByRole('combobox', { name: 'Find context' }), {
      target: { value: 'pre' },
      inputType: 'insertText',
    })

    expect(screen.getByRole('option', { name: /Preview/ }).getAttribute('data-highlighted')).toBe(
      '',
    )
  })

  it('keeps trigger content and tooltip composition on one constrained control', async () => {
    render(
      <ContextSwitcher.Root items={['main']} defaultValue="main">
        <ContextSwitcher.Trigger label="Switch context" tooltip="Current context" width="s">
          <svg aria-hidden="true" data-testid="context-icon" />
          <span>Main</span>
        </ContextSwitcher.Trigger>
      </ContextSwitcher.Root>,
    )

    const trigger = screen.getByRole('combobox', { name: 'Switch context' })
    const content = trigger.querySelector('[data-slot="context-switcher-trigger-content"]')

    expect(trigger.getAttribute('data-width')).toBe('s')
    expect(content?.contains(screen.getByTestId('context-icon'))).toBe(true)
    expect(content?.textContent).toBe('Main')
    expect(trigger.getAttribute('title')).toBeNull()
    fireEvent.mouseEnter(trigger)
    fireEvent.mouseMove(trigger)
    expect(await screen.findByText('Current context')).toBeTruthy()
  })
})
