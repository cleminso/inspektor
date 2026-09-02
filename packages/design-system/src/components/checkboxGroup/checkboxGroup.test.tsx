import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { CheckboxGroup, type CheckboxGroupItem } from './checkboxGroup'

const items: readonly CheckboxGroupItem[] = [
  { value: 'fixed', label: 'Fixed', disabled: true },
  { value: 'name', label: 'Name' },
  { value: 'role', label: 'Role' },
]

function TestCheckboxGroup(): React.ReactElement {
  const [value, setValue] = useState(['fixed', 'name'])

  return (
    <CheckboxGroup.Root items={items} value={value} onValueChange={setValue}>
      <CheckboxGroup.List label="Visible fields" rendering="deferred" />
      <output aria-label="Selected values">{value.join(',')}</output>
    </CheckboxGroup.Root>
  )
}

afterEach(cleanup)

describe('CheckboxGroup', () => {
  it('supports uncontrolled selection', () => {
    render(
      <CheckboxGroup.Root items={items} defaultValue={['fixed']}>
        <CheckboxGroup.List label="Visible fields" />
      </CheckboxGroup.Root>,
    )

    const name = screen.getByRole('checkbox', { name: 'Select Name' })
    fireEvent.click(name)

    expect(name.getAttribute('aria-checked')).toBe('true')
  })

  it('disables every mutable option from the root', () => {
    render(
      <CheckboxGroup.Root items={items} disabled>
        <CheckboxGroup.List label="Visible fields" />
      </CheckboxGroup.Root>,
    )

    expect(
      screen.getByRole('checkbox', { name: 'Select Name' }).getAttribute('aria-disabled'),
    ).toBe('true')
    expect(screen.getByRole('checkbox', { name: 'Select Name' }).getAttribute('tabindex')).toBe(
      '-1',
    )
    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Select Name' }), { key: 'Enter' })
    expect(screen.getByRole('checkbox', { name: 'Select Name' }).getAttribute('aria-checked')).toBe(
      'false',
    )
    expect(screen.queryByRole('button', { name: 'Only Name' })).toBeNull()
  })

  it('owns toggling and contextual actions while preserving disabled selections', () => {
    const { container } = render(<TestCheckboxGroup />)

    fireEvent.click(screen.getByRole('button', { name: 'Check all from Name' }))
    expect(screen.getByRole('status', { name: 'Selected values' }).textContent).toBe(
      'fixed,name,role',
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Name' }))
    expect(screen.getByRole('status', { name: 'Selected values' }).textContent).toBe('fixed,role')

    fireEvent.click(screen.getByRole('button', { name: 'Check all from Role' }))
    expect(screen.getByRole('status', { name: 'Selected values' }).textContent).toBe(
      'fixed,name,role',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Only Role' }))
    expect(screen.getByRole('status', { name: 'Selected values' }).textContent).toBe('fixed,role')
    expect(
      container.querySelectorAll('[data-slot="checkbox-group-row"][data-rendering="deferred"]'),
    ).toHaveLength(3)
  })

  it('navigates mutable rows and action columns with arrow, Home, and End keys', () => {
    render(<TestCheckboxGroup />)

    const name = screen.getByRole('checkbox', { name: 'Select Name' })

    name.focus()
    fireEvent.keyDown(name, { key: 'Enter' })
    expect(screen.getByRole('status', { name: 'Selected values' }).textContent).toBe('fixed')

    const currentName = screen.getByRole('checkbox', { name: 'Select Name' })
    const currentRole = screen.getByRole('checkbox', { name: 'Select Role' })
    currentName.focus()
    fireEvent.keyDown(currentName, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(currentRole)

    fireEvent.keyDown(currentRole, { key: 'Home' })
    expect(document.activeElement).toBe(currentName)

    fireEvent.keyDown(currentName, { key: 'End' })
    expect(document.activeElement).toBe(currentRole)

    fireEvent.keyDown(currentRole, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Only Role' }))

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Home' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Only Name' }))

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Only Role' }))

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(currentRole)
  })
})
