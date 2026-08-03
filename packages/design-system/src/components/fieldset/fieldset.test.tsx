import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Input } from '../input/input'
import { Fieldset } from './fieldset'

afterEach(cleanup)

describe('Fieldset', () => {
  it('groups a legend with controls and propagates disabled state', () => {
    render(
      <Fieldset.Root disabled>
        <Fieldset.Legend>Connection</Fieldset.Legend>
        <Input aria-label="Server URL" />
      </Fieldset.Root>,
    )

    const fieldset = screen.getByRole('group', { name: 'Connection' })
    const input = screen.getByRole('textbox', { name: 'Server URL' }) as HTMLInputElement

    expect(fieldset.tagName).toBe('FIELDSET')
    expect(fieldset.hasAttribute('disabled')).toBe(true)
    expect(input.matches(':disabled')).toBe(true)
  })
})
