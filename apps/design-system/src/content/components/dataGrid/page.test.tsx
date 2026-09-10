import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { dataGridItem } from '@/lib/registry'

import DataGridContent from './page.mdx'

describe('Data Grid documentation', () => {
  it('renders a semantic accounts table', () => {
    render(
      <ComponentPage item={dataGridItem}>
        <DataGridContent />
      </ComponentPage>,
    )

    expect(screen.getByRole('table', { name: 'Accounts' })).toBeTruthy()
    expect(screen.getByRole('cell', { name: 'account_0001' })).toBeTruthy()
    expect(screen.getByText('3 rows')).toBeTruthy()
  })
})
