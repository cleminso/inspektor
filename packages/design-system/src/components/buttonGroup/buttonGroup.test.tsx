import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ButtonGroup, ButtonGroupSeparator } from './buttonGroup'

afterEach(cleanup)

describe('ButtonGroup', () => {
  it('keeps package-owned role and orientation attributes authoritative', () => {
    render(
      <ButtonGroup
        orientation="vertical"
        {...({ role: 'presentation', 'data-orientation': 'horizontal' } as object)}
      >
        <ButtonGroupSeparator
          orientation="horizontal"
          {...({ role: 'presentation', 'aria-orientation': 'vertical' } as object)}
        />
      </ButtonGroup>,
    )

    const group = screen.getByRole('group')
    const separator = screen.getByRole('separator')

    expect(group.getAttribute('data-orientation')).toBe('vertical')
    expect(separator.getAttribute('aria-orientation')).toBe('horizontal')
    expect(separator.getAttribute('data-orientation')).toBe('horizontal')
  })
})
