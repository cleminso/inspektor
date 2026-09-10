import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { fieldItem } from '@/lib/registry'

import FieldContent from './page.mdx'

describe('Field documentation', () => {
  it('renders labelled default and invalid fields', () => {
    render(
      <ComponentPage item={fieldItem}>
        <FieldContent />
      </ComponentPage>,
    )

    expect(screen.getAllByRole('textbox', { name: 'Email' })).toHaveLength(2)
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy()
  })
})
