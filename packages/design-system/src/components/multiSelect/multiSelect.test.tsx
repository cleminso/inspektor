import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef, useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { MultiSelect, type MultiSelectItem } from './multiSelect'

const items: readonly MultiSelectItem[] = [
  { value: 'design', label: 'Design System', disabled: true },
  { value: 'components', label: 'Components' },
  { value: 'tokens', label: 'Design Tokens' },
]

function TestMultiSelect({ initialValue = ['design', 'components'] }: { initialValue?: string[] }) {
  const [value, setValue] = useState(initialValue)

  return (
    <MultiSelect.Root items={items} value={value} onValueChange={setValue}>
      <MultiSelect.Trigger label="Choose options">Options</MultiSelect.Trigger>
      <MultiSelect.Content label="Options" />
      <output aria-label="Selected values">{value.join(',')}</output>
    </MultiSelect.Root>
  )
}

afterEach(cleanup)

describe('MultiSelect', () => {
  it('keeps complete large-collection metadata while deferring offscreen rendering', () => {
    const largeItems = Array.from({ length: 101 }, (_, index) => ({
      label: `Option ${index + 1}`,
      value: `option-${index + 1}`,
    }))

    const { container } = render(
      <MultiSelect.Root items={largeItems}>
        <MultiSelect.Trigger label="Choose large collection">Options</MultiSelect.Trigger>
        <MultiSelect.Content label="Large options" />
      </MultiSelect.Root>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Choose large collection' }))

    const rows = container.ownerDocument.querySelectorAll('[data-slot="multi-select-row"]')
    const firstCheckbox = screen.getByRole('checkbox', { name: 'Select Option 1' })
    const lastCheckbox = screen.getByRole('checkbox', { name: 'Select Option 101' })

    expect(rows).toHaveLength(101)
    expect(rows[0]?.getAttribute('data-rendering')).toBe('deferred')

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Large options' }), {
      key: 'ArrowDown',
    })
    fireEvent.keyDown(firstCheckbox, { key: 'End' })
    expect(document.activeElement).toBe(lastCheckbox)
  })

  it('uses an overflow-aware overlay scrollbar for its options', () => {
    const { container } = render(<TestMultiSelect />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose options' }))

    const options = screen.getByRole('group', { name: 'Options' })
    const scrollArea = container.ownerDocument.querySelector(
      '[data-slot="multi-select-scroll-area"]',
    )
    const viewport = container.ownerDocument.querySelector('[data-slot="multi-select-viewport"]')

    expect(scrollArea?.getAttribute('data-scrollbar')).toBe('overlay')
    expect(viewport?.contains(options)).toBe(true)
  })

  it('opens with dialog focus and exposes named checkbox rows', async () => {
    render(<TestMultiSelect />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose options' }))

    expect(screen.queryByRole('searchbox')).toBeNull()
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Options' }))
    })
    expect(
      screen.getByRole('checkbox', { name: 'Select Design System' }).getAttribute('aria-disabled'),
    ).toBe('true')
    expect(screen.getByRole('checkbox', { name: 'Select Components' })).toBeTruthy()
  })

  it('enters the first or last mutable row from dialog focus', () => {
    render(<TestMultiSelect />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose options' }))
    const dialog = screen.getByRole('dialog', { name: 'Options' })

    fireEvent.keyDown(dialog, { key: 'ArrowDown' })

    expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Select Components' }))

    dialog.focus()
    fireEvent.keyDown(dialog, { key: 'ArrowUp' })

    expect(document.activeElement).toBe(
      screen.getByRole('checkbox', { name: 'Select Design Tokens' }),
    )
  })

  it('toggles several values without closing', () => {
    render(<TestMultiSelect />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose options' }))

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Components' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Design Tokens' }))

    expect(screen.getByRole('dialog', { name: 'Options' })).toBeTruthy()
    expect(screen.getByRole('status', { name: 'Selected values' }).textContent).toBe(
      'design,tokens',
    )
  })

  it('offers Check all and Only actions based on selection state', () => {
    render(<TestMultiSelect />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose options' }))

    fireEvent.click(screen.getByRole('button', { name: 'Check all from Components' }))
    expect(screen.getByRole('status', { name: 'Selected values' }).textContent).toBe(
      'design,components,tokens',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Only Design Tokens' }))
    expect(screen.getByRole('status', { name: 'Selected values' }).textContent).toBe(
      'design,tokens',
    )
  })

  it('navigates rows and their actions with arrow keys', () => {
    render(<TestMultiSelect />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose options' }))

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Options' }), { key: 'ArrowDown' })
    const components = screen.getByRole('checkbox', { name: 'Select Components' })
    expect(document.activeElement).toBe(components)

    fireEvent.keyDown(components, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Check all from Components' }),
    )

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Only Design Tokens' }))

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(
      screen.getByRole('checkbox', { name: 'Select Design Tokens' }),
    )
  })

  it('toggles a focused checkbox with Enter', () => {
    render(<TestMultiSelect />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose options' }))
    const checkbox = screen.getByRole('checkbox', { name: 'Select Components' })

    checkbox.focus()
    fireEvent.keyDown(checkbox, { key: 'Enter' })

    expect(screen.getByRole('status', { name: 'Selected values' }).textContent).toBe('design')
  })

  it('does not change a disabled option when Enter is dispatched', () => {
    render(<TestMultiSelect />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose options' }))

    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Select Design System' }), {
      key: 'Enter',
    })

    expect(screen.getByRole('status', { name: 'Selected values' }).textContent).toBe(
      'design,components',
    )
  })

  it('preserves the consumer Trigger ref while retaining internal focus behavior', async () => {
    const ref = createRef<HTMLButtonElement>()

    render(
      <MultiSelect.Root items={items}>
        <MultiSelect.Trigger ref={ref} label="Choose options">
          Options
        </MultiSelect.Trigger>
        <MultiSelect.Content label="Options" />
      </MultiSelect.Root>,
    )

    const trigger = screen.getByRole('button', { name: 'Choose options' })
    expect(ref.current).toBe(trigger)

    fireEvent.click(trigger)
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Options' }), {
      key: 'Escape',
    })

    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('closes with Escape and restores trigger focus', async () => {
    render(<TestMultiSelect />)
    const trigger = screen.getByRole('button', { name: 'Choose options' })
    fireEvent.click(trigger)

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Options' }), {
      key: 'Escape',
    })

    expect(screen.queryByRole('dialog', { name: 'Options' })).toBeNull()
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })
  })
})
