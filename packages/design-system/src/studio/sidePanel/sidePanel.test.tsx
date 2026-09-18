import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SidePanel } from './sidePanel'

afterEach(cleanup)

describe('SidePanel', () => {
  it('renders a semantic panel with its structural regions', () => {
    render(
      <SidePanel.Root aria-label="Inspektor panel">
        <SidePanel.Header>Header</SidePanel.Header>
        <SidePanel.Body>Body</SidePanel.Body>
        <SidePanel.Footer>Footer</SidePanel.Footer>
      </SidePanel.Root>,
    )

    expect(screen.getByRole('complementary', { name: 'Inspektor panel' })).toBeTruthy()
    expect(screen.getByText('Header')).toBeTruthy()
    expect(screen.getByText('Body').closest('[data-scrollbar="overlay"]')).toBeTruthy()
    expect(screen.getByText('Footer')).toBeTruthy()
  })
})
