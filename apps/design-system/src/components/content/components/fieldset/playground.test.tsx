import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FieldsetPlayground, serializeFieldsetPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('Fieldset playground', () => {
  it('serializes the safe field group without a redundant disabled prop', () => {
    const source = serializeFieldsetPlayground({ disabled: false })

    expect(source).toContain('<Fieldset.Legend>Billing details</Fieldset.Legend>')
    expect(source).toContain('<Field.Root name="company">')
    expect(source).not.toContain('disabled')
  })

  it('updates and resets the grouped controls and source', () => {
    const { container } = render(<FieldsetPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    fireEvent.click(screen.getByRole('button', { name: 'Code' }))

    expect((screen.getByRole('textbox', { name: 'Company' }) as HTMLInputElement).disabled).toBe(
      true,
    )
    expect(container.querySelector('pre')?.textContent).toContain('disabled')

    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))

    expect((screen.getByRole('textbox', { name: 'Company' }) as HTMLInputElement).disabled).toBe(
      false,
    )
    expect(container.querySelector('pre')?.textContent).not.toContain('disabled')
  })
})
