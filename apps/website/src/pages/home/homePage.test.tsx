import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HomePage } from './homePage'

describe('HomePage', () => {
  it('renders the accepted content and landmarks', () => {
    render(<HomePage />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'inspektor studio explore your Jazz application\u00a0data',
      }),
    ).not.toBeNull()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
    expect(screen.getByRole('img', { name: 'Inspektor' })).not.toBeNull()
    expect(screen.getByRole('main')).not.toBeNull()
    expect(
      screen.getByText(
        /Connect to your Jazz sync server from your browser to inspect schemas and records, filter data, edit supported rows, and monitor live queries\./,
      ),
    ).not.toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByRole('link', { name: 'Open Inspektor' }).getAttribute('href')).toBe('/conn')
  })
})
