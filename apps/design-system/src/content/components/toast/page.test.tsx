import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import FeedbackDemo from './demos/feedbackDemo'

describe('Toast documentation', () => {
  it('restores the reversible row action through Undo', async () => {
    render(<FeedbackDemo />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete row' }))
    expect(
      screen.getByRole('button', { name: 'Row deleted' }).getAttribute('disabled'),
    ).not.toBeNull()

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('button', { name: 'Delete row' }).getAttribute('disabled')).toBeNull()
  })
})
