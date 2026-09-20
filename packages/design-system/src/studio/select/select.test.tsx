import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { InputGroup } from '../inputGroup/inputGroup'
import { Select } from './select'

afterEach(cleanup)

const items = [
  { label: 'Main', value: 'main' },
  { label: 'Preview', value: 'preview' },
] as const

describe('Select', () => {
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

  it('joins an input group as its editable member', () => {
    render(
      <Select.Root items={items} defaultValue="main">
        <InputGroup size="s">
          <Select.Trigger aria-label="Branch" width="full" />
        </InputGroup>
      </Select.Root>,
    )

    const trigger = screen.getByRole('combobox', { name: 'Branch' })

    expect(trigger.getAttribute('data-grouped')).toBe('')
    expect(trigger.getAttribute('data-size')).toBe('s')
  })
})
