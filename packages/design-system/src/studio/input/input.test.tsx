import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Input } from './input'

afterEach(cleanup)

describe('Input', () => {
  it('projects Inspektor visual decisions and invalid state', () => {
    render(
      <>
        <Input aria-label="Name" />
        <Input aria-label="Identifier" font="mono" invalid value="row-1" variant="subtle" />
      </>,
    )

    expect(screen.getByRole('textbox', { name: 'Name' }).getAttribute('data-size')).toBe('l')
    const identifier = screen.getByRole('textbox', { name: 'Identifier' })
    expect(identifier.getAttribute('data-variant')).toBe('subtle')
    expect(identifier.getAttribute('data-font')).toBe('mono')
    expect(identifier.getAttribute('aria-invalid')).toBe('true')
    expect(identifier.hasAttribute('data-invalid')).toBe(true)
  })
})
