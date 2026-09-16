import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WebsitePage } from './index'

describe('WebsitePage', () => {
  it('renders the accepted first-iteration content and landmarks', () => {
    render(<WebsitePage />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('inspektor studio')
    expect(
      screen.getByRole('heading', { level: 2, name: 'inspect your Jazz application data' }),
    ).not.toBeNull()
    expect(screen.getByRole('img', { name: 'Inspektor' })).not.toBeNull()
    expect(screen.getByRole('main')).not.toBeNull()
    expect(screen.getByText(/Inspektor connects to your sync server/)).not.toBeNull()
    expect(screen.queryByRole('link', { name: 'Open Inspektor' })).toBeNull()
  })
})
