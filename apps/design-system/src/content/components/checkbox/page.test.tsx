import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { checkboxItem } from '@/lib/registry'

import CheckboxContent from './page.mdx'

describe('Checkbox documentation', () => {
  it('renders disabled unchecked, checked, and indeterminate states', () => {
    render(
      <ComponentPage item={checkboxItem}>
        <CheckboxContent />
      </ComponentPage>,
    )

    const unchecked = screen.getByRole('checkbox', { name: 'Disabled' })
    const checked = screen.getByRole('checkbox', { name: 'Disabled checked' })
    const indeterminate = screen.getByRole('checkbox', { name: 'Disabled indeterminate' })

    expect(unchecked.getAttribute('aria-disabled')).toBe('true')
    expect(unchecked.getAttribute('aria-checked')).toBe('false')
    expect(checked.getAttribute('aria-disabled')).toBe('true')
    expect(checked.getAttribute('aria-checked')).toBe('true')
    expect(indeterminate.getAttribute('aria-disabled')).toBe('true')
    expect(indeterminate.getAttribute('aria-checked')).toBe('mixed')
  })
})
