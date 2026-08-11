import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'

import { Select, type SelectRootProps } from './select'

afterEach(cleanup)

const items = [
  { label: 'Main', value: 'main' },
  { label: 'Preview', value: 'preview' },
] as const

function Options() {
  return (
    <Select.Content>
      <Select.Item value="main">Main</Select.Item>
      <Select.Item value="preview">Preview</Select.Item>
    </Select.Content>
  )
}

describe('Select', () => {
  it('owns the trigger value, icon, popup structure, and item presentation', () => {
    render(
      <Select.Root items={items} defaultValue="main" defaultOpen>
        <Select.Trigger aria-label="Branch" />
        <Options />
      </Select.Root>,
    )

    const trigger = screen.getByRole('combobox')
    const option = screen.getByRole('option', { name: 'Main' })

    expect(trigger.textContent).toContain('Main')
    expect(trigger.querySelectorAll('[data-slot="select-icon"]')).toHaveLength(1)
    expect(option.querySelectorAll('[data-slot="select-item-indicator"]')).toHaveLength(1)
    expect(option.querySelectorAll('[data-slot="select-item-text"]')).toHaveLength(1)
    expect(screen.getByRole('listbox').getAttribute('data-scrollbar')).toBe('standard')
  })

  it('uses a chevron trigger icon and places the selected check after the item text', () => {
    render(
      <Select.Root items={items} defaultValue="main" defaultOpen>
        <Select.Trigger aria-label="Branch" />
        <Options />
      </Select.Root>,
    )

    const triggerIcon = screen.getByRole('combobox').querySelector('[data-slot="select-icon"]')
    const option = screen.getByRole('option', { name: 'Main' })
    const itemText = option.querySelector('[data-slot="select-item-text"]')
    const itemIndicator = option.querySelector('[data-slot="select-item-indicator"]')

    expect(triggerIcon?.querySelector('[data-slot="select-chevron"]')).toBeTruthy()
    expect(itemText?.nextElementSibling).toBe(itemIndicator)
  })

  it('renders a trigger placeholder through its constrained API', () => {
    render(
      <Select.Root items={items}>
        <Select.Trigger aria-label="Branch" placeholder="Select a branch" />
      </Select.Root>,
    )

    expect(screen.getByRole('combobox').textContent).toContain('Select a branch')
  })

  it('preserves single-select value and form types', () => {
    expectTypeOf<SelectRootProps<'main' | 'preview'>['value']>().toEqualTypeOf<
      'main' | 'preview' | null | undefined
    >()
    expectTypeOf<SelectRootProps<'main' | 'preview'>['defaultValue']>().toEqualTypeOf<
      'main' | 'preview' | null | undefined
    >()
    expectTypeOf<SelectRootProps<'main' | 'preview'>['name']>().toEqualTypeOf<
      string | undefined
    >()
  })

  it('updates an uncontrolled value through an item', () => {
    render(
      <Select.Root items={items} defaultValue="main" defaultOpen>
        <Select.Trigger aria-label="Branch" />
        <Options />
      </Select.Root>,
    )

    const option = screen.getByRole('option', { name: 'Preview' })
    fireEvent.pointerDown(option, { pointerType: 'mouse' })
    fireEvent.click(option)

    expect(screen.getByRole('combobox').textContent).toContain('Preview')
  })

  it('reports a controlled value change without replacing the controlled value', () => {
    const onValueChange = vi.fn()
    render(
      <Select.Root items={items} value="main" onValueChange={onValueChange} defaultOpen>
        <Select.Trigger aria-label="Branch" />
        <Options />
      </Select.Root>,
    )

    const option = screen.getByRole('option', { name: 'Preview' })
    fireEvent.pointerDown(option, { pointerType: 'mouse' })
    fireEvent.click(option)

    expect(onValueChange).toHaveBeenCalledWith('preview', expect.any(Object))
    expect(screen.getByRole('combobox').textContent).toContain('Main')
  })

  it('disables the complete control and individual items', () => {
    const onDisabledControlChange = vi.fn()
    const { rerender } = render(
      <Select.Root items={items} disabled onValueChange={onDisabledControlChange} defaultOpen>
        <Select.Trigger aria-label="Branch" placeholder="Select a branch" />
        <Options />
      </Select.Root>,
    )

    expect(screen.getByRole('combobox').hasAttribute('disabled')).toBe(true)
    fireEvent.click(screen.getByRole('option', { name: 'Preview' }))
    expect(onDisabledControlChange).not.toHaveBeenCalled()

    const onDisabledItemChange = vi.fn()
    rerender(
      <Select.Root items={items} onValueChange={onDisabledItemChange} defaultOpen>
        <Select.Trigger aria-label="Branch" />
        <Select.Content>
          <Select.Item value="main">Main</Select.Item>
          <Select.Item value="preview" disabled>
            Preview
          </Select.Item>
        </Select.Content>
      </Select.Root>,
    )

    const disabledItem = screen.getByRole('option', { name: 'Preview' })
    fireEvent.click(disabledItem)
    expect(disabledItem.getAttribute('aria-disabled')).toBe('true')
    expect(onDisabledItemChange).not.toHaveBeenCalled()
  })

  it('associates its label with the trigger', () => {
    render(
      <Select.Root>
        <Select.Label>Branch</Select.Label>
        <Select.Trigger placeholder="Select a branch" />
      </Select.Root>,
    )

    expect(screen.getByRole('combobox', { name: 'Branch' })).toBeTruthy()
  })

  it('applies constrained trigger size and width options', () => {
    render(
      <Select.Root>
        <Select.Trigger aria-label="Branch" size="l" width="full" />
      </Select.Root>,
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger.getAttribute('data-size')).toBe('l')
    expect(trigger.getAttribute('data-width')).toBe('full')
  })

  it('uses the large shared control size by default', () => {
    render(
      <Select.Root>
        <Select.Trigger aria-label="Branch" />
      </Select.Root>,
    )

    expect(screen.getByRole('combobox').getAttribute('data-size')).toBe('l')
  })

})
