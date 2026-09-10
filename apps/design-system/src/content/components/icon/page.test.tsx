import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { iconItem } from '@/lib/registry'

import IconContent from './page.mdx'

describe('Icon documentation', () => {
  it('renders every supported semantic size as decorative artwork', () => {
    render(
      <ComponentPage item={iconItem}>
        <IconContent />
      </ComponentPage>,
    )

    const example = screen.getByRole('region', { name: 'Component example' })
    const icons = [...example.querySelectorAll('[data-docs-component-preview] [data-slot="icon"]')]
    expect(icons.map((icon) => icon.getAttribute('data-size'))).toEqual(['xs', 's', 'm'])
    expect(icons.every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(true)
  })
})
