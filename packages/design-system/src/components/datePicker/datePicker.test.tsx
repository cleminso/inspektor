import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from '../button/button'
import { InputGroup } from '../inputGroup/inputGroup'
import { DatePicker } from './datePicker'

afterEach(cleanup)

describe('DatePicker', () => {
  it('applies an inline date step without creating a nested popup', () => {
    const onApply = vi.fn()
    const value = new Date(2026, 7, 13, 12)
    render(
      <DatePicker value={value} onApply={onApply}>
        <DatePicker.Panel />
      </DatePicker>,
    )

    expect(screen.getByRole('group', { name: 'Choose date and time' })).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'Choose date and time' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith(value)
  })

  it('resets an inline draft when the committed value changes', () => {
    const onApply = vi.fn()
    const initialValue = new Date(2026, 7, 13, 12)
    const nextValue = new Date(2026, 8, 2, 9, 30)
    const { rerender } = render(
      <DatePicker value={initialValue} onApply={onApply}>
        <DatePicker.Panel />
      </DatePicker>,
    )

    rerender(
      <DatePicker value={nextValue} onApply={onApply}>
        <DatePicker.Panel />
      </DatePicker>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(onApply).toHaveBeenCalledWith(nextValue)
  })

  it('opens from its input-styled button trigger', () => {
    render(
      <DatePicker value={new Date(2026, 7, 13, 12)} onApply={vi.fn()}>
        <DatePicker.Trigger label="Edit timestamp">Aug 13, 2026, 12:00 PM</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    const trigger = screen.getByRole('button', { name: 'Edit timestamp' })
    expect(trigger.getAttribute('data-slot')).toBe('date-picker-trigger')

    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Choose date and time' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Choose month, August' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Choose year, 2026' })).toBeTruthy()
  })

  it('lets an InputGroup own the compound control border', () => {
    render(
      <InputGroup fullWidth>
        <DatePicker value={undefined} onApply={vi.fn()}>
          <DatePicker.Trigger label="Edit timestamp">Select Date</DatePicker.Trigger>
          <DatePicker.Content />
        </DatePicker>
        <InputGroup.Suffix>UTC</InputGroup.Suffix>
      </InputGroup>,
    )

    const trigger = screen.getByRole('button', { name: 'Edit timestamp' })
    expect(trigger.getAttribute('data-grouped')).toBe('')
    expect(trigger.parentElement?.getAttribute('data-slot')).toBe('input-group')
    expect(trigger.textContent).toBe('Select Date')
  })

  it('composes trigger behavior onto another design-system button', () => {
    const ref = createRef<HTMLButtonElement>()

    render(
      <DatePicker value={undefined} onApply={vi.fn()}>
        <DatePicker.Trigger
          ref={ref}
          label="Edit cell timestamp"
          render={<Button variant="secondary" />}
        >
          Empty
        </DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    const trigger = screen.getByRole('button', { name: 'Edit cell timestamp' })
    expect(ref.current).toBe(trigger)
    expect(trigger.getAttribute('data-slot')).toBe('button')

    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('selects the current date and time when an empty DatePicker opens', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 13, 9, 10, 11, 120))

    render(
      <DatePicker value={undefined} onApply={vi.fn()} defaultOpen>
        <DatePicker.Trigger label="Edit timestamp">Empty</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    const today = screen.getByRole('button', { name: /Today, Thursday, August 13th, 2026/i })
    expect(today.parentElement?.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(false)
    expect(screen.queryByRole('textbox', { name: 'Date' })).toBeNull()
    expect(screen.getByLabelText('Time').getAttribute('value')).toBe('09:10:11')

    vi.useRealTimers()
  })

  it('uses the current clock time when the first day is selected', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 13, 9, 10, 11, 120))
    const onApply = vi.fn()

    render(
      <DatePicker value={undefined} onApply={onApply} defaultOpen>
        <DatePicker.Trigger label="Edit timestamp">Empty</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Friday, August 14th, 2026/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply.mock.calls[0]?.[0]).toEqual(new Date(2026, 7, 14, 9, 10, 11, 120))

    vi.useRealTimers()
  })

  it('preserves the existing time when another day is selected', () => {
    const onApply = vi.fn()

    render(
      <DatePicker value={new Date(2026, 7, 13, 12, 34, 56, 789)} onApply={onApply} defaultOpen>
        <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Friday, August 14th, 2026/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(onApply.mock.calls[0]?.[0]).toEqual(new Date(2026, 7, 14, 12, 34, 56, 789))
  })

  it('preserves years below 100 when another day is selected', () => {
    const value = new Date(0)
    value.setFullYear(42, 7, 13)
    value.setHours(12, 34, 56, 789)
    const minValue = new Date(value.getTime())
    minValue.setFullYear(1, 0, 1)
    const maxValue = new Date(value.getTime())
    maxValue.setFullYear(99, 11, 31)
    const expectedValue = new Date(value.getTime())
    expectedValue.setDate(14)
    const onApply = vi.fn()

    render(
      <DatePicker
        value={value}
        minValue={minValue}
        maxValue={maxValue}
        onApply={onApply}
        defaultOpen
      >
        <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    fireEvent.click(screen.getByRole('button', { name: /August 14th, 42/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(onApply).toHaveBeenCalledWith(expectedValue)
  })

  it('starts keyboard traversal at navigation and moves between days with arrow keys', async () => {
    render(
      <DatePicker value={new Date(2026, 7, 13, 12)} onApply={vi.fn()}>
        <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit timestamp' }))
    expect(screen.getByRole('button', { name: 'Go to the Previous Month' }).tabIndex).toBe(0)
    expect(screen.getByRole('button', { name: 'Choose month, August' }).tabIndex).toBe(0)
    expect(screen.getByRole('button', { name: 'Choose year, 2026' }).tabIndex).toBe(0)
    expect(screen.getByRole('button', { name: 'Go to the Next Month' }).tabIndex).toBe(0)

    const selectedDay = screen.getByRole('button', {
      name: /Thursday, August 13th, 2026, selected/i,
    })
    selectedDay.focus()
    fireEvent.keyDown(selectedDay, { key: 'ArrowRight' })
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: /Friday, August 14th, 2026/i }),
      ),
    )
  })

  it('keeps an invalid time draft editable without corrupting the pending timestamp', () => {
    const onApply = vi.fn()

    render(
      <DatePicker value={new Date(2026, 7, 13, 12, 34, 56, 789)} onApply={onApply} defaultOpen>
        <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    const time = screen.getByLabelText('Time')
    fireEvent.change(time, { target: { value: 'a' } })
    expect(time.getAttribute('value')).toBe('a')
    expect(time.getAttribute('data-invalid')).toBeNull()
    fireEvent.blur(time)
    expect(time.getAttribute('data-invalid')).toBe('')
    expect(time.getAttribute('data-touched')).toBe('')
    expect(screen.getByText('Use HH:MM:SS format.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(true)

    fireEvent.change(time, { target: { value: '09:15:30' } })
    expect(time.getAttribute('value')).toBe('09:15:30')
    expect(time.getAttribute('data-invalid')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith(new Date(2026, 7, 13, 9, 15, 30, 789))
  })

  it('enforces minimum and maximum timestamps including their time', () => {
    render(
      <DatePicker
        value={new Date(2026, 7, 13, 10, 30)}
        minValue={new Date(2026, 7, 13, 10)}
        maxValue={new Date(2026, 7, 13, 11)}
        onApply={vi.fn()}
        defaultOpen
      >
        <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    const apply = screen.getByRole('button', { name: 'Apply' })
    const time = screen.getByLabelText('Time')
    expect(
      screen
        .getByRole('button', { name: /Thursday, August 13th, 2026, selected/i })
        .hasAttribute('disabled'),
    ).toBe(false)

    fireEvent.change(time, { target: { value: '09:59:59' } })
    expect(apply.hasAttribute('disabled')).toBe(true)
    fireEvent.blur(time)
    expect(screen.getByText(/on or after/)).toBeTruthy()

    fireEvent.change(time, { target: { value: '10:15:00' } })
    expect(apply.hasAttribute('disabled')).toBe(false)

    fireEvent.change(time, { target: { value: '11:00:01' } })
    expect(apply.hasAttribute('disabled')).toBe(true)
    fireEvent.blur(time)
    expect(screen.getByText(/on or before/)).toBeTruthy()
  })

  it('disables day selection with the rest of timestamp editing', () => {
    render(
      <DatePicker value={new Date(2026, 7, 13, 12)} onApply={vi.fn()} disabled>
        <DatePicker.Panel />
      </DatePicker>,
    )

    expect(
      screen
        .getByRole('button', { name: /Thursday, August 13th, 2026, selected/i })
        .hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Choose month, August' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(screen.getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(true)
  })

  it('sets the pending value to now and applies it explicitly', () => {
    vi.useFakeTimers()
    const now = new Date(2026, 7, 13, 17, 45, 30, 456)
    vi.setSystemTime(now)
    const onApply = vi.fn()

    render(
      <DatePicker value={undefined} onApply={onApply} defaultOpen>
        <DatePicker.Trigger label="Edit timestamp">Empty</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Set now' }))
    expect(onApply).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith(now)

    vi.useRealTimers()
  })

  it('discards pending changes when Escape closes the popup', async () => {
    const value = new Date(2026, 7, 13, 12, 34, 56, 789)
    const onApply = vi.fn()

    render(
      <DatePicker value={value} onApply={onApply}>
        <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    const trigger = screen.getByRole('button', { name: 'Edit timestamp' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: /Friday, August 14th, 2026/i }))
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Choose date and time' }), {
      key: 'Escape',
    })

    expect(onApply).not.toHaveBeenCalled()
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('restores the committed month after calendar navigation is dismissed', () => {
    render(
      <DatePicker value={new Date(2026, 7, 13, 12)} onApply={vi.fn()}>
        <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    const trigger = screen.getByRole('button', { name: 'Edit timestamp' })
    fireEvent.click(trigger)
    expect(screen.getByRole('status').textContent).toBe('August 2026')
    fireEvent.click(screen.getByRole('button', { name: 'Go to the Next Month' }))
    expect(screen.getByRole('button', { name: 'Choose month, September' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('September 2026')

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Choose date and time' }), {
      key: 'Escape',
    })
    fireEvent.click(trigger)

    expect(screen.getByRole('button', { name: 'Choose month, August' })).toBeTruthy()
  })

  it('selects a visible month from an in-calendar grid without changing the pending date', () => {
    const value = new Date(2026, 7, 13, 12)
    const onApply = vi.fn()
    render(
      <DatePicker value={value} onApply={onApply} defaultOpen>
        <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Choose month, August' }))
    expect(screen.getByRole('grid', { name: 'Choose month' })).toBeTruthy()
    expect(screen.queryByLabelText('Time')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Go to the Previous Month' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Go to the Next Month' }).hasAttribute('disabled'),
    ).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'September' }))
    expect(screen.queryByRole('grid', { name: 'Choose month' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Choose month, September' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith(value)
  })

  it('pages through years and returns to the day grid after choosing a year', async () => {
    const value = new Date(2026, 7, 13, 12)
    const onApply = vi.fn()
    render(
      <DatePicker
        value={value}
        minValue={new Date(2000, 0, 1)}
        maxValue={new Date(2060, 11, 31, 23, 59, 59)}
        onApply={onApply}
        defaultOpen
      >
        <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Choose month, August' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose year, 2026' }))
    expect(screen.getByRole('grid', { name: 'Choose year' })).toBeTruthy()
    expect(screen.queryByLabelText('Time')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull()
    const selectedYear = screen.getByRole('button', { name: '2026' })
    await waitFor(() => expect(document.activeElement).toBe(selectedYear))

    fireEvent.click(screen.getByRole('button', { name: 'Show next 20 years' }))
    expect(screen.queryByRole('button', { name: '2026' })).toBeNull()
    expect(screen.getByRole('status').textContent).toBe('Years 2040 to 2059')
    fireEvent.click(screen.getByRole('button', { name: '2042' }))

    expect(screen.queryByRole('grid', { name: 'Choose year' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Choose year, 2042' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith(value)
  })

  it('supports arrow-key month selection and restores focus to the month trigger', async () => {
    const onKeyDown = vi.fn()
    render(
      <div
        aria-label="DatePicker keyboard boundary"
        role="toolbar"
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <DatePicker value={new Date(2026, 7, 13, 12)} onApply={vi.fn()} defaultOpen>
          <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
          <DatePicker.Content />
        </DatePicker>
      </div>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Choose month, August' }))
    const august = screen.getByRole('button', { name: 'August' })
    await waitFor(() => expect(document.activeElement).toBe(august))
    fireEvent.keyDown(august, { key: 'ArrowRight' })
    const september = screen.getByRole('button', { name: 'September' })
    expect(document.activeElement).toBe(september)
    expect(onKeyDown).not.toHaveBeenCalled()
    fireEvent.keyDown(september, { key: 'Enter' })

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Choose month, September' }),
    )
  })

  it('returns from a selector grid before Escape closes the calendar', () => {
    render(
      <DatePicker value={new Date(2026, 7, 13, 12)} onApply={vi.fn()} defaultOpen>
        <DatePicker.Trigger label="Edit timestamp">Timestamp</DatePicker.Trigger>
        <DatePicker.Content />
      </DatePicker>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Choose month, August' }))
    fireEvent.keyDown(screen.getByRole('grid', { name: 'Choose month' }), { key: 'Escape' })

    expect(screen.queryByRole('grid', { name: 'Choose month' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Choose date and time' })).toBeTruthy()
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Choose month, August' }),
    )
  })
})
