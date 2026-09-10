import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DefaultDemo from './demos/defaultDemo'

describe('Side Panel documentation', () => {
  it('shows the complete panel structure', () => {
    const { container } = render(<DefaultDemo />)

    expect(screen.getByRole('complementary', { name: 'Available tables' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Tables' })).toBeTruthy()
    expect(screen.getByRole('list').children).toHaveLength(12)
    expect(screen.getByText('12 tables')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(container.querySelector('[data-slot="side-panel-header"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="side-panel-body"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="side-panel-footer"]')).not.toBeNull()
  })
})
