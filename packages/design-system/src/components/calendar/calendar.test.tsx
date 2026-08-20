import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Calendar } from './calendar'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Calendar', () => {
  it('selects a date without rendering timestamp controls', () => {
    const onValueChange = vi.fn()

    render(
      <Calendar
        value={new Date(2026, 7, 13)}
        onValueChange={onValueChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Friday, August 14th, 2026/i }))

    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 7, 14))
    expect(screen.queryByLabelText('Time')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull()
  })

  it('supports uncontrolled date selection', () => {
    render(<Calendar defaultValue={new Date(2026, 7, 13)} />)

    fireEvent.click(screen.getByRole('button', { name: /Friday, August 14th, 2026/i }))

    expect(
      screen.getByRole('button', { name: /Friday, August 14th, 2026, selected/i }),
    ).toBeTruthy()
  })

  it('does not update controlled selection when an empty value is retained', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 13, 12))
    const onValueChange = vi.fn()

    render(<Calendar value={undefined} onValueChange={onValueChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Friday, August 14th, 2026/i }))

    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 7, 14))
    expect(screen.queryByRole('button', { name: /Friday, August 14th, 2026, selected/i })).toBeNull()
  })

  it('preserves years below 100 during month navigation', () => {
    const value = new Date(0)
    value.setFullYear(42, 7, 13)
    value.setHours(0, 0, 0, 0)

    render(<Calendar defaultValue={value} minValue={value} />)

    fireEvent.click(screen.getByRole('button', { name: 'Go to the Next Month' }))

    expect(screen.getByRole('button', { name: 'Choose year, 42' })).toBeTruthy()
  })

  it('exposes month and year selection as part of the standalone surface', () => {
    render(<Calendar defaultValue={new Date(2026, 7, 13)} />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose month, August' }))
    expect(screen.getByRole('grid', { name: 'Choose month' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Choose year, 2026' }))
    expect(screen.getByRole('grid', { name: 'Choose year' })).toBeTruthy()
  })
})
