import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { comboboxItem } from '@/lib/registry'

import ComboboxContent from './page.mdx'

describe('Combobox documentation', () => {
  it('renders the default, custom item, and state examples', () => {
    render(
      <ComponentPage item={comboboxItem}>
        <ComboboxContent />
      </ComponentPage>,
    )

    const branchInput = screen.getByRole('combobox', { name: 'Branch' }) as HTMLInputElement
    expect(branchInput.value).toBe('develop')

    fireEvent.click(screen.getByRole('button', { name: 'Clear branch' }))
    expect(branchInput.value).toBe('')

    const connectionInput = screen.getByRole('combobox', { name: 'Connection' })
    fireEvent.click(screen.getByRole('button', { name: 'Connection' }))
    fireEvent.change(connectionInput, { target: { value: 'inventory' } })
    expect(screen.getByRole('option', { name: 'Production' })).toBeTruthy()
    fireEvent.keyDown(connectionInput, { key: 'Escape' })

    expect(
      (screen.getByRole('combobox', { name: 'Generated branch' }) as HTMLInputElement).readOnly,
    ).toBe(true)
    expect(
      (screen.getByRole('combobox', { name: 'Unavailable branch' }) as HTMLInputElement).disabled,
    ).toBe(true)
  })
})
