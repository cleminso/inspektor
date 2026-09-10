import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { dataGridFilterClauseItem } from '@/lib/registry'

import DataGridFilterClauseContent from './page.mdx'

describe('Data Grid Filter Clause documentation', () => {
  it('renders applied and invalid filter clauses', () => {
    render(
      <ComponentPage item={dataGridFilterClauseItem}>
        <DataGridFilterClauseContent />
      </ComponentPage>,
    )

    expect(
      screen.getByRole('button', { name: 'Edit filter created at after August 18' }),
    ).toBeTruthy()
    expect(screen.getByText('Choose a valid timestamp.')).toBeTruthy()
  })
})
