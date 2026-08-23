import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TimestampValue } from './timestampValue'

afterEach(() => {
  cleanup()
})

const formatLocal = (epochMilliseconds: number) =>
  new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    second: '2-digit',
    year: 'numeric',
  }).format(epochMilliseconds)

describe('TimestampValue', () => {
  it('renders local text while preserving the exact ISO instant in dateTime', () => {
    const value = 1_700_000_000_123
    render(<TimestampValue value={value} />)

    const time = screen.getByText(formatLocal(value))
    expect(time.getAttribute('datetime')).toBe('2023-11-14T22:13:20.123Z')
    expect(time.getAttribute('data-numeric-variant')).toBe('tabular')
    expect(time.getAttribute('data-typography')).toBe('mono')
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_VALUE, new Date(Number.NaN)])(
    'renders invalid input %s without throwing',
    (value) => {
      render(<TimestampValue value={value} />)

      expect(screen.getByText('Invalid timestamp')).toBeTruthy()
      expect(screen.queryByRole('time')).toBeNull()
    },
  )

  it('owns its styling and accepts only number or Date inputs', () => {
    // @ts-expect-error TimestampValue owns its styling.
    const classNameProp = <TimestampValue className="off-system" value={0} />
    // @ts-expect-error TimestampValue accepts only timestamp input shapes.
    const stringProp = <TimestampValue value="2023-11-14T22:13:20Z" />

    expect(classNameProp).toBeTruthy()
    expect(stringProp).toBeTruthy()
  })
})
