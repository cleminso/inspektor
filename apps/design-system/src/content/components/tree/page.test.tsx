import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import NavigationDemo from './demos/navigationDemo'

describe('Tree documentation', () => {
  it('uses valid documentation destinations', () => {
    render(<NavigationDemo />)

    expect(screen.getByRole('link', { name: 'Colors' }).getAttribute('href')).toBe(
      '/foundations/colors',
    )
    expect(screen.getByRole('link', { name: 'Tree' }).getAttribute('href')).toBe('/components/tree')
  })
})
