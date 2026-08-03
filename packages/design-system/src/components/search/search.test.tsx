import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Search } from './search'

afterEach(cleanup)

describe('Search', () => {
  it('renders a search input with its default leading icon', () => {
    const { container } = render(<Search aria-label="Search tables" />)

    expect(screen.getByRole('searchbox', { name: 'Search tables' })).toBeTruthy()
    expect(
      screen.getByRole('searchbox', { name: 'Search tables' }).getAttribute('data-variant'),
    ).toBe('subtle')
    expect(container.querySelector('[data-slot="search-icon"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="keyboard-input"]')).toBeNull()
  })

  it('renders the Command K shortcut using the macOS keyboard treatment', () => {
    render(<Search aria-label="Search tables" shortcut="command-k" />)

    const shortcut = screen.getByLabelText('Command K')

    expect(shortcut.tagName).toBe('KBD')
    expect(shortcut.getAttribute('data-platform')).toBe('macos')
    expect(shortcut.getAttribute('data-size')).toBe('small')
  })

  it('disables the search input while retaining its shortcut hint', () => {
    render(<Search aria-label="Search tables" shortcut="command-k" disabled />)

    expect(
      (screen.getByRole('searchbox', { name: 'Search tables' }) as HTMLInputElement).disabled,
    ).toBe(true)
    expect(screen.getByLabelText('Command K')).toBeTruthy()
  })
})
