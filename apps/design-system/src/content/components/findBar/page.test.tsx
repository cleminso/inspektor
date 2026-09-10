import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { findBarItem } from '@/lib/registry'

import FindBarContent from './page.mdx'

describe('Find Bar documentation', () => {
  it('renders controlled occurrence navigation', () => {
    render(
      <ComponentPage item={findBarItem}>
        <FindBarContent />
      </ComponentPage>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Next match' }))

    expect(screen.getByRole('status', { name: 'Match 2 of 6' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Match case' }))
    expect(screen.getByRole('status', { name: 'Match 1 of 6' })).toBeTruthy()
    expect(
      (screen.getByRole('searchbox', { name: 'Find in document' }) as HTMLInputElement).value,
    ).toBe('account')
  })
})
