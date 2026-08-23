import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Toolbar } from './toolbar'

afterEach(cleanup)

describe('Toolbar', () => {
  it('renders primary content beside a grouped action area', () => {
    render(
      <Toolbar actions={<button type="button">Insert row</button>} pagination={<span>Page 1</span>}>
        <span>Filter builder</span>
      </Toolbar>,
    )

    expect(screen.getByText('Filter builder')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Insert row' })).toBeTruthy()
    expect(
      screen.getByText('Filter builder').compareDocumentPosition(screen.getByText('Page 1')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      screen
        .getByText('Page 1')
        .compareDocumentPosition(screen.getByRole('button', { name: 'Insert row' })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
