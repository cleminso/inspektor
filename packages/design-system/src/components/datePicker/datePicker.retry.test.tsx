import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const calendarModule = vi.hoisted(() => ({ attempts: 0 }))

vi.mock('./datePickerCalendar', () => {
  calendarModule.attempts += 1
  if (calendarModule.attempts === 1) throw new Error('Calendar unavailable')
  return { DatePickerCalendar: () => 'Calendar loaded' }
})

import { DatePicker } from './datePicker'

afterEach(cleanup)

describe('DatePicker calendar retry boundary', () => {
  it('retries a failed calendar import from a later mount', async () => {
    const firstRender = render(
      <DatePicker value={new Date(2026, 7, 13, 12)} onApply={vi.fn()}>
        <DatePicker.Panel />
      </DatePicker>,
    )

    expect((await screen.findByRole('alert')).textContent).toBe(
      'DatePicker failed to load calendar',
    )
    firstRender.unmount()

    render(
      <DatePicker value={new Date(2026, 7, 13, 12)} onApply={vi.fn()}>
        <DatePicker.Panel />
      </DatePicker>,
    )

    expect(await screen.findByText('Calendar loaded')).toBeTruthy()
    expect(calendarModule.attempts).toBe(2)
  })
})
