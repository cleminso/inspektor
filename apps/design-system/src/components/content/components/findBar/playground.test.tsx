import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FindBarPlayground, findBarPlaygroundSource } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('FindBar playground', () => {
  it('documents the constrained find contract', () => {
    expect(findBarPlaygroundSource).toContain('<FindBar')
    expect(findBarPlaygroundSource).not.toContain('fullWidth')
    expect(findBarPlaygroundSource).not.toContain('size=')
  })

  it('navigates the simulated result set', () => {
    render(<FindBarPlayground />)

    expect(screen.getByRole('status', { name: 'Match 1 of 6' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next match' }))
    expect(screen.getByRole('status', { name: 'Match 2 of 6' })).toBeTruthy()
  })
})
