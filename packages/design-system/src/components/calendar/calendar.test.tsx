import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from '../button/button'
import { Calendar } from './calendar'

afterEach(cleanup)

describe('Calendar', () => {
  it('opens from its input-styled button trigger', () => {
    render(
      <Calendar value={new Date(2026, 7, 13, 12)} onApply={vi.fn()}>
        <Calendar.Trigger label="Edit timestamp">Aug 13, 2026, 12:00 PM</Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
    )

    const trigger = screen.getByRole('button', { name: 'Edit timestamp' })
    expect(trigger.getAttribute('data-slot')).toBe('calendar-trigger')

    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Choose date and time' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Choose the Month' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Choose the Year' })).toBeTruthy()
  })

  it('composes trigger behavior onto another design-system button', () => {
    const ref = createRef<HTMLButtonElement>()

    render(
      <Calendar value={undefined} onApply={vi.fn()}>
        <Calendar.Trigger
          ref={ref}
          label="Edit cell timestamp"
          render={<Button variant="secondary" />}
        >
          Empty
        </Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
    )

    const trigger = screen.getByRole('button', { name: 'Edit cell timestamp' })
    expect(ref.current).toBe(trigger)
    expect(trigger.getAttribute('data-slot')).toBe('button')

    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('focuses today without selecting it and initializes the local time when the value is empty', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 13, 9, 10, 11, 120))

    render(
      <Calendar value={undefined} onApply={vi.fn()} defaultOpen>
        <Calendar.Trigger label="Edit timestamp">Empty</Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
    )

    const today = screen.getByRole('button', { name: /Today, Thursday, August 13th, 2026/i })
    expect(today.getAttribute('aria-selected')).not.toBe('true')
    expect(screen.getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(true)
    expect(screen.queryByRole('textbox', { name: 'Date' })).toBeNull()
    expect(screen.getByLabelText('Time').getAttribute('value')).toBe('09:10:11')

    vi.useRealTimers()
  })

  it('uses the current clock time when the first day is selected', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 13, 9, 10, 11, 120))
    const onApply = vi.fn()

    render(
      <Calendar value={undefined} onApply={onApply} defaultOpen>
        <Calendar.Trigger label="Edit timestamp">Empty</Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
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
      <Calendar value={new Date(2026, 7, 13, 12, 34, 56, 789)} onApply={onApply} defaultOpen>
        <Calendar.Trigger label="Edit timestamp">Timestamp</Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Friday, August 14th, 2026/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(onApply.mock.calls[0]?.[0]).toEqual(new Date(2026, 7, 14, 12, 34, 56, 789))
  })

  it('starts keyboard traversal at navigation and moves between days with arrow keys', async () => {
    render(
      <Calendar value={new Date(2026, 7, 13, 12)} onApply={vi.fn()}>
        <Calendar.Trigger label="Edit timestamp">Timestamp</Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit timestamp' }))
    expect(screen.getByRole('button', { name: 'Go to the Previous Month' }).tabIndex).toBe(0)
    expect(screen.getByRole('combobox', { name: 'Choose the Month' }).tabIndex).toBe(0)
    expect(screen.getByRole('combobox', { name: 'Choose the Year' }).tabIndex).toBe(0)
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
      <Calendar value={new Date(2026, 7, 13, 12, 34, 56, 789)} onApply={onApply} defaultOpen>
        <Calendar.Trigger label="Edit timestamp">Timestamp</Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
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
      <Calendar
        value={new Date(2026, 7, 13, 10, 30)}
        minValue={new Date(2026, 7, 13, 10)}
        maxValue={new Date(2026, 7, 13, 11)}
        onApply={vi.fn()}
        defaultOpen
      >
        <Calendar.Trigger label="Edit timestamp">Timestamp</Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
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

  it('sets the pending value to now and applies it explicitly', () => {
    vi.useFakeTimers()
    const now = new Date(2026, 7, 13, 17, 45, 30, 456)
    vi.setSystemTime(now)
    const onApply = vi.fn()

    render(
      <Calendar value={undefined} onApply={onApply} defaultOpen>
        <Calendar.Trigger label="Edit timestamp">Empty</Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
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
      <Calendar value={value} onApply={onApply}>
        <Calendar.Trigger label="Edit timestamp">Timestamp</Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
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
      <Calendar value={new Date(2026, 7, 13, 12)} onApply={vi.fn()}>
        <Calendar.Trigger label="Edit timestamp">Timestamp</Calendar.Trigger>
        <Calendar.Content />
      </Calendar>,
    )

    const trigger = screen.getByRole('button', { name: 'Edit timestamp' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: 'Go to the Next Month' }))
    expect(
      (screen.getByRole('combobox', { name: 'Choose the Month' }) as HTMLSelectElement)
        .selectedOptions[0]?.textContent,
    ).toBe('Sep')

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Choose date and time' }), {
      key: 'Escape',
    })
    fireEvent.click(trigger)

    expect(
      (screen.getByRole('combobox', { name: 'Choose the Month' }) as HTMLSelectElement)
        .selectedOptions[0]?.textContent,
    ).toBe('Aug')
  })
})
