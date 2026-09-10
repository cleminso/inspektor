import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { contextSwitcherItem } from '@/lib/registry'

import ContextSwitcherContent from './page.mdx'

describe('Context Switcher documentation', () => {
  it('renders branch, connection, and trigger state examples', () => {
    render(
      <ComponentPage item={contextSwitcherItem}>
        <ContextSwitcherContent />
      </ComponentPage>,
    )

    const branchTrigger = screen.getByRole('combobox', { name: 'Switch branch' })
    fireEvent.click(branchTrigger)

    const branchSearch = screen.getByRole('combobox', { name: 'Search branches' })
    fireEvent.change(branchSearch, { target: { value: 'schema' } })
    fireEvent.click(screen.getByRole('option', { name: 'feature/schema-view' }))

    expect(branchTrigger.textContent).toContain('feature/schema-view')

    const connectionTrigger = screen.getByRole('combobox', { name: 'Switch connection' })
    fireEvent.click(connectionTrigger)

    const connectionSearch = screen.getByRole('combobox', { name: 'Search connections' })
    fireEvent.change(connectionSearch, { target: { value: 'billing-preview' } })
    fireEvent.click(
      screen.getByRole('option', { name: /Staging/, description: 'billing-preview' }),
    )

    expect(connectionTrigger.textContent).toContain('Staging')
    expect(screen.getByRole('combobox', { name: 'Choose workspace' }).textContent).toContain(
      'Choose a workspace',
    )
    expect(
      (screen.getByRole('combobox', { name: 'Unavailable context' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})
