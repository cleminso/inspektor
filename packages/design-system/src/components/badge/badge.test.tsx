import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from './badge'

describe('Badge', () => {
  it('renders non-interactive text without consumer styling escape hatches', () => {
    render(
      <Badge
        {...({
          'data-testid': 'badge',
          className: 'consumer-style',
          style: { color: 'red' },
        } as object)}
      >
        Latest
      </Badge>,
    )

    const badge = screen.getByTestId('badge')

    expect(badge.tagName).toBe('SPAN')
    expect(badge.textContent).toBe('Latest')
    expect(badge.className).not.toContain('consumer-style')
    expect(badge.style.color).not.toBe('red')
  })
})
