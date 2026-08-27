import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TextField } from './textField'

afterEach(cleanup)

describe('TextField', () => {
  it('derives invalid state only when an external error is present', () => {
    const { rerender } = render(<TextField label="App ID" />)

    expect(screen.getByRole('textbox', { name: 'App ID' }).getAttribute('aria-invalid')).not.toBe(
      'true',
    )

    rerender(<TextField label="App ID" error="App ID is required" />)

    expect(screen.getByRole('textbox', { name: 'App ID' }).getAttribute('aria-invalid')).toBe(
      'true',
    )
    expect(screen.getByText('App ID is required')).toBeTruthy()
  })
})
