import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FieldPlayground, serializeFieldPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('Field playground', () => {
  it('serializes a representative Field composition', () => {
    const source = serializeFieldPlayground({
      disabled: false,
      invalid: false,
      description: true,
      error: false,
    })

    expect(source).toContain('<Field.Root name="email">')
    expect(source).toContain('<Field.Label>Email</Field.Label>')
    expect(source).toContain('<Field.Description>')
    expect(source).not.toContain('invalid')
  })

  it('updates and resets preview and source from one state', () => {
    const { container } = render(<FieldPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Invalid' }))
    fireEvent.click(screen.getByRole('button', { name: 'Code' }))

    expect(screen.getByRole('textbox', { name: 'Email' }).getAttribute('aria-invalid')).toBe('true')
    expect(container.querySelector('pre')?.textContent).toContain('invalid')

    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))

    expect(screen.getByRole('textbox', { name: 'Email' }).getAttribute('aria-invalid')).not.toBe(
      'true',
    )
    expect(container.querySelector('pre')?.textContent).not.toContain('invalid')
  })
})
