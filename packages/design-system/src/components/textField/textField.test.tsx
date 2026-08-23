import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TextField } from './textField'

afterEach(cleanup)

describe('TextField', () => {
  it('makes a field invalid when an external error is present', () => {
    render(<TextField label="App ID" error="App ID is required" />)

    expect(screen.getByRole('textbox', { name: 'App ID' }).getAttribute('aria-invalid')).toBe(
      'true',
    )
    expect(screen.getByText('App ID is required')).toBeTruthy()
  })

  it('does not force invalid state without an error', () => {
    render(<TextField label="App ID" />)

    expect(screen.getByRole('textbox', { name: 'App ID' }).getAttribute('aria-invalid')).not.toBe(
      'true',
    )
  })

  it('preserves native required validity without parallel field state', () => {
    render(<TextField label="App ID" required />)
    const input = screen.getByRole('textbox', { name: 'App ID' }) as HTMLInputElement

    fireEvent.focus(input)
    fireEvent.blur(input)

    expect(input.validity.valueMissing).toBe(true)
    expect(input.getAttribute('aria-invalid')).not.toBe('true')

    fireEvent.change(input, { target: { value: 'app-id' } })

    expect(input.validity.valueMissing).toBe(false)
  })
})
