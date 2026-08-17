import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import BasicExample from './basicExample'

afterEach(cleanup)

describe('FloatingPanel basic example', () => {
  it('returns to the compact width when leaving review', () => {
    render(<BasicExample />)

    const panelContent = document.querySelector('[data-slot="floating-panel-content"]')
    const reviewButton = screen.getAllByRole('button', { name: '3 pending tasks' })[1]
    expect(reviewButton).toBeDefined()

    fireEvent.click(reviewButton!)
    expect(panelContent?.getAttribute('data-size')).toBe('expanded')

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(panelContent?.getAttribute('data-size')).toBe('compact')
  })
})
