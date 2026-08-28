import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const calendarModule = vi.hoisted(() => {
  let resolve: (module: unknown) => void = () => undefined
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
})

vi.mock('./datePickerCalendar', () => calendarModule.promise)

import { DatePicker } from './datePicker'

afterEach(cleanup)

describe('DatePicker calendar loading boundary', () => {
  it('keeps a bounded panel visible while the calendar loads', () => {
    render(
      <DatePicker value={new Date(2026, 7, 13, 12)} onApply={vi.fn()}>
        <DatePicker.Panel />
      </DatePicker>,
    )

    expect(screen.getByRole('group', { name: 'Choose date and time' })).toBeTruthy()
    expect(screen.getByRole('status', { name: 'Loading date picker' }).textContent).toBe(
      'Loading calendar…',
    )
  })

  it('does not steal focus when the calendar resolves after focus moves away', async () => {
    render(
      <>
        <button type="button">Outside</button>
        <DatePicker value={new Date(2026, 7, 13, 12)} onApply={vi.fn()}>
          {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- The test verifies delayed focus ownership. */}
          <DatePicker.Panel autoFocus />
        </DatePicker>
      </>,
    )

    const loading = screen.getByRole('status', { name: 'Loading date picker' })
    await waitFor(() => expect(document.activeElement).toBe(loading))
    const outside = screen.getByRole('button', { name: 'Outside' })
    outside.focus()
    calendarModule.resolve({
      DatePickerCalendar: ({ autoFocus }: { autoFocus: boolean }) => (
        // oxlint-disable-next-line jsx-a11y/no-autofocus -- The mock exposes whether the deferred boundary restores focus.
        <button autoFocus={autoFocus} type="button">
          Deferred calendar
        </button>
      ),
    })

    expect(await screen.findByRole('button', { name: 'Deferred calendar' })).toBeTruthy()
    expect(document.activeElement).toBe(outside)
  })
})
