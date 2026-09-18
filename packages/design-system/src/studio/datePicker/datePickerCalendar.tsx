import { Popover as BasePopover } from '@base-ui/react/popover'
import * as stylex from '@stylexjs/stylex'
import { useEffect, useState } from 'react'

import { Button } from '../button/button'
import { CalendarSurface, type CalendarView } from '../calendar/calendar'
import { Field } from '../field/field'
import { Input } from '../input/input'
import { datePickerStyles } from './datePicker.styles'
import type { DatePickerContextValue } from './datePicker'

function formatTimeInput(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}

function parseTimeInput(
  value: string,
): [hours: number, minutes: number, seconds: number] | undefined {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value)
  if (match === null) return undefined
  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  if (hours > 23 || minutes > 59 || seconds > 59) return undefined
  return [hours, minutes, seconds]
}

function combineDayAndTime(day: Date, time: Date): Date {
  const value = new Date(day.getTime())
  value.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds())
  return value
}

function isTimestampInRange(
  value: Date,
  minValue: Date | undefined,
  maxValue: Date | undefined,
): boolean {
  if (minValue !== undefined && value.getTime() < minValue.getTime()) return false
  if (maxValue !== undefined && value.getTime() > maxValue.getTime()) return false
  return true
}

function formatTimestampBoundary(value: Date): string {
  return value.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

interface DatePickerCalendarProps {
  autoFocus: boolean
  closeOnApply: boolean
  context: DatePickerContextValue
}

export function DatePickerCalendar({
  autoFocus,
  closeOnApply,
  context,
}: DatePickerCalendarProps): React.ReactElement {
  const [view, setView] = useState<CalendarView>('day')
  const [timeInput, setTimeInput] = useState(() => formatTimeInput(context.pendingValue))
  const parsedTime = parseTimeInput(timeInput)
  useEffect(() => setTimeInput(formatTimeInput(context.resetValue)), [context.resetValue])
  const pendingIsInRange = isTimestampInRange(
    context.pendingValue,
    context.minValue,
    context.maxValue,
  )
  const validateTime = (): string | null => {
    if (parsedTime === undefined) return 'Use HH:MM:SS format.'
    if (
      context.minValue !== undefined &&
      context.pendingValue.getTime() < context.minValue.getTime()
    ) {
      return `Choose a date and time on or after ${formatTimestampBoundary(context.minValue)}.`
    }
    if (
      context.maxValue !== undefined &&
      context.pendingValue.getTime() > context.maxValue.getTime()
    ) {
      return `Choose a date and time on or before ${formatTimestampBoundary(context.maxValue)}.`
    }
    return null
  }
  const applyDisabled = context.disabled || parsedTime === undefined || pendingIsInRange === false
  const applyButton = (
    <Button
      disabled={applyDisabled}
      layout="fill"
      size="s"
      variant="secondary"
      onClick={context.apply}
    >
      Apply
    </Button>
  )

  return (
    <>
      <CalendarSurface
        // oxlint-disable-next-line jsx-a11y/no-autofocus -- Explicit picker steps transfer focus into the calendar.
        autoFocus={autoFocus}
        disabled={context.disabled}
        maxValue={context.maxValue}
        minValue={context.minValue}
        required
        resetValue={context.resetValue}
        value={context.pendingValue}
        onValueChange={(day) => {
          if (day !== undefined)
            context.setPendingValue(combineDayAndTime(day, context.pendingValue))
        }}
        onViewChange={setView}
      />
      {view === 'day' && (
        <div {...stylex.props(datePickerStyles.controls)}>
          <div {...stylex.props(datePickerStyles.timeRow)}>
            <Field.Root
              disabled={context.disabled}
              validationMode="onBlur"
              validate={validateTime}
              {...stylex.props(datePickerStyles.field)}
            >
              <Field.Label {...stylex.props(datePickerStyles.controlLabel)}>Time</Field.Label>
              <Input
                disabled={context.disabled}
                fullWidth
                invalid={false}
                inputMode="numeric"
                size="m"
                type="text"
                value={timeInput}
                onValueChange={(nextInput) => {
                  setTimeInput(nextInput)
                  const nextParsedTime = parseTimeInput(nextInput)
                  if (nextParsedTime === undefined) return
                  const [hours, minutes, seconds] = nextParsedTime
                  const nextValue = new Date(context.pendingValue.getTime())
                  nextValue.setHours(hours, minutes, seconds, nextValue.getMilliseconds())
                  context.setPendingValue(nextValue)
                }}
                render={
                  <input
                    aria-label="Time"
                    {...stylex.props(datePickerStyles.input)}
                  />
                }
              />
              <Field.Error />
            </Field.Root>
            <div {...stylex.props(datePickerStyles.setNowAction)}>
              <Button
                disabled={context.disabled}
                layout="fill"
                size="m"
                variant="ghost"
                onClick={() => {
                  const now = new Date()
                  context.setPendingValue(now)
                  setTimeInput(formatTimeInput(now))
                }}
              >
                Set now
              </Button>
            </div>
          </div>
          <div {...stylex.props(datePickerStyles.applyAction)}>
            {closeOnApply ? (
              <BasePopover.Close
                disabled={applyDisabled}
                render={applyButton}
              />
            ) : (
              applyButton
            )}
          </div>
        </div>
      )}
    </>
  )
}
