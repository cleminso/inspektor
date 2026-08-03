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
  it('preserves single-select value types', () => {
    expectTypeOf<SelectRootProps<'main' | 'preview'>['value']>().toEqualTypeOf<
      'main' | 'preview' | null | undefined
    >()
    expectTypeOf<SelectRootProps<'main' | 'preview'>['defaultValue']>().toEqualTypeOf<
      'main' | 'preview' | null | undefined
    >()
  })

  it('updates an uncontrolled value through a composed item', () => {
    render(
      <Select.Root items={items} defaultValue="main" defaultOpen>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
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
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Options />
      </Select.Root>,
    )

    const option = screen.getByRole('option', { name: 'Preview' })
    fireEvent.pointerDown(option, { pointerType: 'mouse' })
    fireEvent.click(option)

    expect(onValueChange).toHaveBeenCalledWith('preview', expect.any(Object))
    expect(screen.getByRole('combobox').textContent).toContain('Main')
  })

  it('disables the control and individual options', () => {
    const onDisabledControlChange = vi.fn()
    const { rerender } = render(
      <Select.Root items={items} disabled onValueChange={onDisabledControlChange} defaultOpen>
        <Select.Trigger>
          <Select.Value placeholder="Branch" />
        </Select.Trigger>
        <Options />
      </Select.Root>,
    )

    expect(screen.getByRole('combobox').hasAttribute('disabled')).toBe(true)
    const disabledRootOption = screen.getByRole('option', { name: 'Preview' })
    fireEvent.pointerDown(disabledRootOption, { pointerType: 'mouse' })
    fireEvent.click(disabledRootOption)
    expect(onDisabledControlChange).not.toHaveBeenCalled()

    const onDisabledOptionChange = vi.fn()
    rerender(
      <Select.Root items={items} onValueChange={onDisabledOptionChange} defaultOpen>
        <Select.Trigger>
          <Select.Value placeholder="Branch" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="main">Main</Select.Item>
          <Select.Item value="preview" disabled>
            Preview
          </Select.Item>
        </Select.Content>
      </Select.Root>,
    )

    const disabledOption = screen.getByRole('option', { name: 'Preview' })
    fireEvent.pointerDown(disabledOption, { pointerType: 'mouse' })
    fireEvent.click(disabledOption)
    expect(disabledOption.getAttribute('aria-disabled')).toBe('true')
    expect(onDisabledOptionChange).not.toHaveBeenCalled()
  })

  it('associates its label with the trigger', () => {
    render(
      <Select.Root>
        <Select.Label>Branch</Select.Label>
        <Select.Trigger>
          <Select.Value placeholder="Choose" />
        </Select.Trigger>
      </Select.Root>,
    )

    expect(screen.getByRole('combobox', { name: 'Branch' })).toBeTruthy()
  })

  it('associates grouped options with their group label', () => {
    render(
      <Select.Root defaultOpen>
        <Select.Trigger aria-label="Branch">
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            <Select.GroupLabel>Active branches</Select.GroupLabel>
            <Select.Item value="main">Main</Select.Item>
          </Select.Group>
          <Select.Separator />
          <Select.Item value="archived">Archived</Select.Item>
        </Select.Content>
      </Select.Root>,
    )

    expect(screen.getByRole('group', { name: 'Active branches' })).toBeTruthy()
    expect(screen.getByRole('separator')).toBeTruthy()
  })

  it('applies constrained size and width options', () => {
    render(
      <Select.Root>
        <Select.Trigger size="l" width="full">
          <Select.Value placeholder="Branch" />
        </Select.Trigger>
      </Select.Root>,
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger.getAttribute('data-size')).toBe('l')
    expect(trigger.getAttribute('data-width')).toBe('full')
  })

  it('applies a constrained size to popup items', () => {
    render(
      <Select.Root defaultOpen>
        <Select.Trigger aria-label="Branch">
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="main" size="l">
            Main
          </Select.Item>
        </Select.Content>
      </Select.Root>,
    )

    expect(screen.getByRole('option', { name: 'Main' }).getAttribute('data-size')).toBe('l')
  })

  it('composes trigger adornments and owned icons without duplicating legacy parts', () => {
    const { rerender } = render(
      <Select.Root>
        <Select.Trigger prefix={<span>Repository</span>} suffix={<span>Required</span>}>
          <Select.Value placeholder="Branch" />
        </Select.Trigger>
      </Select.Root>,
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger.querySelectorAll('[data-slot="select-icon"]')).toHaveLength(1)
    expect(trigger.textContent).toContain('Repository')
    expect(trigger.textContent).toContain('Required')

    rerender(
      <Select.Root>
        <Select.Trigger>
          <Select.Value placeholder="Branch" />
          <>
            <Select.Icon />
          </>
        </Select.Trigger>
      </Select.Root>,
    )

    expect(screen.getByRole('combobox').querySelectorAll('[data-slot="select-icon"]')).toHaveLength(
      1,
    )
  })

  it('owns one selected-item indicator while accepting legacy item composition', () => {
    const { rerender } = render(
      <Select.Root defaultValue="main" defaultOpen>
        <Select.Trigger aria-label="Branch">
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="main">Main</Select.Item>
        </Select.Content>
      </Select.Root>,
    )

    expect(
      screen
        .getByRole('option', { name: 'Main' })
        .querySelectorAll('[data-slot="select-item-indicator"]'),
    ).toHaveLength(1)

    rerender(
      <Select.Root defaultValue="main" defaultOpen>
        <Select.Trigger aria-label="Branch">
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="main">
            <>
              <Select.ItemText>Main</Select.ItemText>
              <Select.ItemIndicator />
            </>
          </Select.Item>
        </Select.Content>
      </Select.Root>,
    )

    expect(
      screen
        .getByRole('option', { name: 'Main' })
        .querySelectorAll('[data-slot="select-item-indicator"]'),
    ).toHaveLength(1)
  })
})
