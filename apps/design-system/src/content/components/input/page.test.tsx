import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { inputItem } from '@/lib/registry'

import InputContent from './page.mdx'

describe('Input documentation', () => {
  it('renders labelled input variants and states', () => {
    render(
      <ComponentPage item={inputItem}>
        <InputContent />
      </ComponentPage>,
    )

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeTruthy()
    expect(
      (screen.getByRole('textbox', { name: 'Generated value' }) as HTMLInputElement).readOnly,
    ).toBe(true)
    expect(
      screen.getByRole('textbox', { name: 'Connection URL' }).getAttribute('aria-invalid'),
    ).toBe('true')
  })
})
