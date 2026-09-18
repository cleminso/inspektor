import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Spinner } from './spinner'

afterEach(cleanup)

describe('Spinner', () => {
  it('exposes a status only when it has an accessible label', () => {
    const { rerender } = render(<Spinner />)

    expect(screen.queryByRole('status')).toBeNull()

    rerender(<Spinner label="Saving changes" />)

    expect(screen.getByRole('status', { name: 'Saving changes' })).not.toBeNull()
  })
})
