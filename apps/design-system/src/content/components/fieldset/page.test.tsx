import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { fieldsetItem } from '@/lib/registry'

import FieldsetContent from './page.mdx'

describe('Fieldset documentation', () => {
  it('renders a semantically labelled credential group', () => {
    render(
      <ComponentPage item={fieldsetItem}>
        <FieldsetContent />
      </ComponentPage>,
    )

    expect(screen.getByRole('group', { name: 'Connection credentials' })).toBeTruthy()
    expect((screen.getByLabelText('Password') as HTMLInputElement).type).toBe('password')
  })
})
