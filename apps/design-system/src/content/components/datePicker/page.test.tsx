import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { datePickerItem } from '@/lib/registry'

import DatePickerContent from './page.mdx'

describe('DatePicker documentation', () => {
  it('renders a controlled timestamp trigger', () => {
    render(
      <ComponentPage item={datePickerItem}>
        <DatePickerContent />
      </ComponentPage>,
    )

    expect(screen.getByRole('button', { name: 'Edit timestamp' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Compositions and bounds' })).toBeTruthy()
  })
})
