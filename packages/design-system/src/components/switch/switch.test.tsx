import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Switch } from './switch'

afterEach(cleanup)

describe('Switch', () => {
  it('preserves checked disabled state without allowing a change', () => {
    let changeCount = 0

    render(
      <Switch
        aria-label="Enable notifications"
        checked
        disabled
        onCheckedChange={() => {
          changeCount += 1
        }}
      />,
    )

    const switchControl = screen.getByRole('switch', { name: 'Enable notifications' })
    fireEvent.click(switchControl)

    expect(switchControl.getAttribute('data-checked')).toBe('')
    expect(switchControl.getAttribute('data-disabled')).toBe('')
    expect(switchControl.getAttribute('aria-checked')).toBe('true')
    expect(changeCount).toBe(0)
  })

  it('keeps read-only switches checked when activated', () => {
    let changeCount = 0

    render(
      <Switch
        aria-label="Enable notifications"
        checked
        readOnly
        onCheckedChange={() => {
          changeCount += 1
        }}
      />,
    )

    const switchControl = screen.getByRole('switch', { name: 'Enable notifications' })
    fireEvent.click(switchControl)

    expect(switchControl.getAttribute('data-checked')).toBe('')
    expect(switchControl.getAttribute('data-readonly')).toBe('')
    expect(changeCount).toBe(0)
  })
})
