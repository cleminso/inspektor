import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ComboboxPlayground, serializeComboboxPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('Combobox playground', () => {
  it('serializes a safe representative composition', () => {
    const source = serializeComboboxPlayground({
      width: 'anchor',
      maxHeight: 'm',
      disabled: false,
      required: false,
    })

    expect(source).toContain('import { Combobox, Field } from "@inspektor/ds";')
    expect(source).toContain('<Combobox.Root items={branches}')
    expect(source).toContain('{(branch: string) => (')
    expect(source).not.toContain('width="anchor"')
  })

  it('updates preview and source from one control state', () => {
    const { container } = render(<ComboboxPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show code' }))

    expect((screen.getByPlaceholderText('Find a branch') as HTMLInputElement).disabled).toBe(true)
    expect(container.querySelector('pre')?.textContent).toContain('disabled')
  })

  it('uses the serialized field name in the preview', () => {
    const { container } = render(<ComboboxPlayground />)

    expect(container.querySelector('[name="branch"]')).not.toBeNull()
    expect(
      serializeComboboxPlayground({
        width: 'anchor',
        maxHeight: 'm',
        disabled: false,
        required: false,
      }),
    ).toContain('<Field.Root name="branch">')
  })
})
