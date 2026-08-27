import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Select } from './select'

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
  it('owns the trigger, popup, and item presentation', () => {
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
    expect(trigger.querySelector('[data-slot="select-chevron"]')).toBeTruthy()
    expect(option.querySelector('[data-slot="select-item-text"]')?.nextElementSibling).toBe(
      option.querySelector('[data-slot="select-item-indicator"]'),
    )
    expect(screen.getByRole('listbox').getAttribute('data-scrollbar')).toBe('standard')
  })

  it('renders a trigger placeholder through its constrained API', () => {
    render(
      <Select.Root items={items}>
        <Select.Trigger aria-label="Branch" placeholder="Select a branch" />
      </Select.Root>,
    )

    expect(screen.getByRole('combobox').textContent).toContain('Select a branch')
  })

  it('applies constrained trigger options and shared defaults', () => {
    render(
      <>
        <Select.Root>
          <Select.Trigger aria-label="Default branch" />
        </Select.Root>
        <Select.Root>
          <Select.Trigger aria-label="Full branch" size="s" width="full" />
        </Select.Root>
      </>,
    )

    expect(screen.getByRole('combobox', { name: 'Default branch' }).getAttribute('data-size')).toBe(
      'l',
    )
    const fullTrigger = screen.getByRole('combobox', { name: 'Full branch' })
    expect(fullTrigger.getAttribute('data-size')).toBe('s')
    expect(fullTrigger.getAttribute('data-width')).toBe('full')
  })
})
