import { CheckboxGroup } from '@base-ui/react/checkbox-group'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Checkbox } from './checkbox'

afterEach(cleanup)

describe('Checkbox', () => {
  it('renders its indicator for the effective mixed group state', () => {
    render(
      <CheckboxGroup allValues={['email', 'sms']} defaultValue={['email']}>
        <Checkbox parent aria-label="Select all notifications" />
        <Checkbox value="email" aria-label="Email" />
        <Checkbox value="sms" aria-label="SMS" />
      </CheckboxGroup>,
    )

    const parent = screen.getByRole('checkbox', { name: 'Select all notifications' })

    expect(parent.getAttribute('aria-checked')).toBe('mixed')
    expect(parent.querySelector('svg')).toBeTruthy()
  })
})
