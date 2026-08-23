import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'

import { Input, type InputSize } from './input'

afterEach(cleanup)

describe('Input', () => {
  it('uses the shared control size vocabulary and preserves the standard control height by default', () => {
    render(<Input aria-label="Name" />)

    expectTypeOf<InputSize>().toEqualTypeOf<'xs' | 's' | 'm' | 'l'>()
    expect(screen.getByRole('textbox', { name: 'Name' }).getAttribute('data-size')).toBe('l')
  })

  it('exposes its constrained visual variant', () => {
    render(<Input aria-label="Filter" variant="subtle" />)

    expect(screen.getByRole('textbox', { name: 'Filter' }).getAttribute('data-variant')).toBe(
      'subtle',
    )
  })

  it('exposes an explicit invalid state to assistive technology', () => {
    render(<Input aria-label="Name" invalid />)

    expect(screen.getByRole('textbox', { name: 'Name' }).getAttribute('aria-invalid')).toBe('true')
  })

  it('preserves read-only native behavior', () => {
    render(<Input aria-label="Identifier" readOnly value="row-1" />)

    expect((screen.getByRole('textbox', { name: 'Identifier' }) as HTMLInputElement).readOnly).toBe(
      true,
    )
  })

  it('supports monospace value typography', () => {
    render(<Input aria-label="Identifier" font="mono" value="row-1" />)

    expect(screen.getByRole('textbox', { name: 'Identifier' }).getAttribute('data-font')).toBe(
      'mono',
    )
  })
})
