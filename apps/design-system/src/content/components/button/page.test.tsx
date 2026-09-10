import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { buttonItem } from '@/lib/registry'

import ButtonContent from './page.mdx'

describe('Button documentation', () => {
  it('renders authored guidance and executable scenarios', () => {
    render(
      <ComponentPage item={buttonItem}>
        <ButtonContent />
      </ComponentPage>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Variants' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Save changes' })).toHaveLength(3)
    expect(screen.getByText('Delete connection')).toBeTruthy()
    expect(screen.queryByText('Reset')).toBeNull()
  })
})
