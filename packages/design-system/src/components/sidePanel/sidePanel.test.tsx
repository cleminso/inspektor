import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SidePanel } from './sidePanel'

afterEach(cleanup)

describe('SidePanel', () => {
  it('renders a semantic panel with its structural regions', () => {
    render(
      <SidePanel.Root aria-label="Inspector panel">
        <SidePanel.Header>Header</SidePanel.Header>
        <SidePanel.Body>Body</SidePanel.Body>
        <SidePanel.Footer>Footer</SidePanel.Footer>
      </SidePanel.Root>,
    )

    expect(screen.getByRole('complementary', { name: 'Inspector panel' })).toBeTruthy()
    expect(screen.getByText('Header')).toBeTruthy()
    expect(screen.getByText('Body')).toBeTruthy()
    expect(screen.getByText('Footer')).toBeTruthy()
  })
})
