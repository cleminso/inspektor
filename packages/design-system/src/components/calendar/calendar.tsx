import { Popover as BasePopover } from '@base-ui/react/popover'
import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type PropsWithChildren,
  type RefCallback,
  type RefObject,
} from 'react'
import {
  DayPicker,
  type ChevronProps,
  type DayButtonProps,
  type MonthChangeEventHandler,
} from 'react-day-picker'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { editableControlStyles } from '../../primitives/editableControl.styles'
import { popupPositioning } from '../../primitives/popupPositioning'
import { Button } from '../button/button'
import { Field } from '../field/field'
import { Input } from '../input/input'
import { calendarStyles } from './calendar.styles'

const calendarLabel = 'Choose date and time'

export interface CalendarRootProps extends PropsWithChildren {
  /** The committed timestamp shown when the calendar opens. */
  value?: Date
  /** Runs with the selected timestamp when Apply is activated. */
  onApply: (value: Date) => void
  /** Whether the popup is open. */
  open?: boolean
  /** Whether the popup is initially open. */
  defaultOpen?: boolean
  /** Runs when the popup opens or closes. */
  onOpenChange?: BasePopover.Root.Props['onOpenChange']
  /** Earliest selectable timestamp. */
  minValue?: Date
  /** Latest selectable timestamp. */
  maxValue?: Date
  /** Disables the trigger and timestamp editing. */
  disabled?: boolean
}

export type CalendarTriggerProps = PropsWithChildren<
  Omit<BasePopover.Trigger.Props, 'aria-label' | 'className' | 'disabled' | 'style'> & {
    /** Stable accessible name for the timestamp trigger. */
    label: string
    /** Composes trigger behavior onto another native button component. */
    render?: BasePopover.Trigger.Props['render']
  }
>

export interface CalendarContentProps {
  /** Aligns the popup along its trigger. */
  align?: BasePopover.Positioner.Props['align']
  /** Keeps the popup mounted while closed. */
  keepMounted?: boolean
}

interface CalendarContextValue {
  disabled: boolean
  maxValue: Date | undefined
  minValue: Date | undefined
  pendingValue: Date | undefined
  pendingTime: Date
  resetMonth: Date
  setPendingValue: (value: Date | undefined) => void
  setPendingTime: (value: Date) => void
  apply: () => void
  triggerRef: RefObject<ComponentRef<typeof BasePopover.Trigger> | null>
}

const CalendarContext = createContext<CalendarContextValue | null>(null)

function useCalendarContext(): CalendarContextValue {
  const context = useContext(CalendarContext)
  if (context === null) {
    throw new Error('Calendar parts must be rendered inside Calendar.')
  }
  return context
}

function isValidDate(value: Date | undefined): value is Date {
  return value !== undefined && Number.isFinite(value.getTime()) === true
}

function cloneDate(value: Date | undefined): Date | undefined {
  return isValidDate(value) === true ? new Date(value.getTime()) : undefined
}

function CalendarRoot({
  children,
  value,
  onApply,
  open,
  defaultOpen = false,
  onOpenChange,
  minValue,
  maxValue,
  disabled = false,
}: CalendarRootProps): React.ReactElement {
  const [pendingValue, setPendingValue] = useState<Date | undefined>(() => cloneDate(value))
  const [pendingTime, setPendingTime] = useState<Date>(() => cloneDate(value) ?? new Date())
  const [resetMonth, setResetMonth] = useState<Date>(() => cloneDate(value) ?? new Date())
  const triggerRef = useRef<ComponentRef<typeof BasePopover.Trigger>>(null)
  const handleOpenChange = useCallback<NonNullable<BasePopover.Root.Props['onOpenChange']>>(
    (nextOpen, eventDetails) => {
      if (nextOpen === true) {
        const nextValue = cloneDate(value)
        const nextTime = nextValue ?? new Date()
        setPendingValue(nextValue)
        setPendingTime(nextTime)
        setResetMonth(nextTime)
      }
      onOpenChange?.(nextOpen, eventDetails)
    },
    [onOpenChange, value],
  )
  const apply = useCallback(() => {
    if (pendingValue === undefined) return
    onApply(new Date(pendingValue.getTime()))
  }, [onApply, pendingValue])
  const contextValue = useMemo<CalendarContextValue>(
    () => ({
      apply,
      disabled,
      maxValue,
      minValue,
      pendingValue,
      pendingTime,
      resetMonth,
      setPendingValue,
      setPendingTime,
      triggerRef,
    }),
    [apply, disabled, maxValue, minValue, pendingTime, pendingValue, resetMonth],
  )

  return (
    <CalendarContext.Provider value={contextValue}>
      <BasePopover.Root
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={handleOpenChange}
      >
        {children}
      </BasePopover.Root>
    </CalendarContext.Provider>
  )
}

const CalendarTrigger = forwardRef<ComponentRef<typeof BasePopover.Trigger>, CalendarTriggerProps>(
  function CalendarTrigger({ label, render, children, ...props }, forwardedRef) {
    const context = useCalendarContext()
    const triggerRef = useCallback(
      (element: ComponentRef<typeof BasePopover.Trigger> | null) => {
        context.triggerRef.current = element
        const cleanup =
          typeof forwardedRef === 'function'
            ? (forwardedRef as RefCallback<ComponentRef<typeof BasePopover.Trigger>>)(element)
            : (() => {
                if (forwardedRef !== null) forwardedRef.current = element
                return undefined
              })()
        return () => {
          context.triggerRef.current = null
          if (typeof cleanup === 'function') cleanup()
          else if (typeof forwardedRef === 'function') forwardedRef(null)
          else if (forwardedRef !== null) forwardedRef.current = null
        }
      },
      [context.triggerRef, forwardedRef],
    )
    const triggerStyles = createStateStyleProps<BasePopover.Trigger.State>((state) => [
      render === undefined && calendarStyles.trigger,
      render === undefined && editableControlStyles.focusVisible,
      state.open === true && calendarStyles.triggerOpen,
      state.open === false && calendarStyles.triggerClosed,
      state.disabled === true && calendarStyles.triggerDisabled,
    ])

    return (
      <BasePopover.Trigger
        {...props}
        ref={triggerRef as BasePopover.Trigger.Props['ref']}
        aria-label={label}
        disabled={context.disabled}
        render={render}
        {...triggerStyles}
        data-slot={render === undefined ? 'calendar-trigger' : undefined}
      >
        {children}
      </BasePopover.Trigger>
    )
  },
)

function CalendarChevron({ orientation, ...props }: ChevronProps): React.ReactElement {
  const iconStyles = stylex.props(calendarStyles.chevron)
  if (orientation === 'down') {
    return <ChevronDown {...props} {...iconStyles} strokeWidth={1.5} />
  }
  const NavigationChevron = orientation === 'left' ? ChevronLeft : ChevronRight
  return <NavigationChevron {...props} {...iconStyles} strokeWidth={1.5} />
}

function CalendarDayButton({ modifiers, ...props }: DayButtonProps): React.ReactElement {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (modifiers.focused === true) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      {...props}
      ref={ref}
      {...stylex.props(
        calendarStyles.dayButton,
        modifiers.selected === true && calendarStyles.daySelected,
        modifiers.outside === true && calendarStyles.dayOutside,
        modifiers.disabled === true && calendarStyles.dayDisabled,
        modifiers.hidden === true && calendarStyles.dayHidden,
      )}
    />
  )
}

function formatTimeInput(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}

function parseTimeInput(value: string): [hours: number, minutes: number, seconds: number] | undefined {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value)
  if (match === null) return undefined
  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  if (hours > 23 || minutes > 59 || seconds > 59) return undefined
  return [hours, minutes, seconds]
}

function combineDayAndTime(day: Date, previous: Date | undefined): Date {
  const time = previous ?? new Date()
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds(),
  )
}

function getYearBoundary(value: Date | undefined, fallbackYear: number): Date {
  return value ?? new Date(fallbackYear, 0, 1)
}

function getDayBoundary(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function isTimestampInRange(
  value: Date | undefined,
  minValue: Date | undefined,
  maxValue: Date | undefined,
): boolean {
  if (value === undefined) return false
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

function CalendarContent({
  align = 'start',
  keepMounted = false,
}: CalendarContentProps): React.ReactElement {
  const context = useCalendarContext()
  const popupRef = useRef<ComponentRef<typeof BasePopover.Popup>>(null)
  const [visibleMonth, setVisibleMonth] = useState(() => context.pendingValue ?? new Date())
  const [timeInput, setTimeInput] = useState(() => formatTimeInput(context.pendingTime))
  const parsedTime = parseTimeInput(timeInput)
  useEffect(() => setTimeInput(formatTimeInput(context.pendingTime)), [context.pendingTime])
  useEffect(() => {
    setVisibleMonth(context.resetMonth)
  }, [context.resetMonth])
  const positionerStyles = createStateStyleProps<BasePopover.Positioner.State>((state) => [
    calendarStyles.positioner,
    state.open === true && calendarStyles.positionerOpen,
    state.open === false && calendarStyles.positionerClosed,
    state.anchorHidden === true && calendarStyles.positionerAnchorHidden,
    state.instant !== undefined && calendarStyles.positionerInstant,
    state.side === 'top' && calendarStyles.positionerSideTop,
    state.side === 'bottom' && calendarStyles.positionerSideBottom,
    state.side === 'left' && calendarStyles.positionerSideLeft,
    state.side === 'right' && calendarStyles.positionerSideRight,
    state.side === 'inline-start' && calendarStyles.positionerSideInlineStart,
    state.side === 'inline-end' && calendarStyles.positionerSideInlineEnd,
    state.align === 'start' && calendarStyles.positionerAlignStart,
    state.align === 'center' && calendarStyles.positionerAlignCenter,
    state.align === 'end' && calendarStyles.positionerAlignEnd,
  ])
  const popupStyles = createStateStyleProps<BasePopover.Popup.State>((state) => [
    calendarStyles.popup,
    state.open === true && calendarStyles.popupOpen,
    state.open === false && calendarStyles.popupClosed,
    state.transitionStatus === 'starting' && calendarStyles.popupStarting,
    state.transitionStatus === 'ending' && calendarStyles.popupEnding,
    state.instant !== undefined && calendarStyles.popupInstant,
    state.side === 'top' && calendarStyles.popupSideTop,
    state.side === 'bottom' && calendarStyles.popupSideBottom,
    state.side === 'left' && calendarStyles.popupSideLeft,
    state.side === 'right' && calendarStyles.popupSideRight,
    state.side === 'inline-start' && calendarStyles.popupSideInlineStart,
    state.side === 'inline-end' && calendarStyles.popupSideInlineEnd,
    state.align === 'start' && calendarStyles.popupAlignStart,
    state.align === 'center' && calendarStyles.popupAlignCenter,
    state.align === 'end' && calendarStyles.popupAlignEnd,
  ])
  const nowYear = new Date().getFullYear()
  const startMonth = getYearBoundary(context.minValue, nowYear - 100)
  const endMonth = getYearBoundary(context.maxValue, nowYear + 100)
  const classNames = {
    root: stylex.props(calendarStyles.calendarRoot).className,
    months: stylex.props(calendarStyles.months).className,
    month: stylex.props(calendarStyles.month).className,
    month_caption: stylex.props(calendarStyles.monthCaption).className,
    dropdowns: stylex.props(calendarStyles.dropdowns).className,
    dropdown_root: stylex.props(calendarStyles.dropdownRoot).className,
    dropdown: stylex.props(calendarStyles.dropdown).className,
    caption_label: stylex.props(calendarStyles.captionLabel).className,
    nav: stylex.props(calendarStyles.nav).className,
    button_previous: stylex.props(
      calendarStyles.navButton,
      calendarStyles.navButtonPrevious,
    ).className,
    button_next: stylex.props(calendarStyles.navButton, calendarStyles.navButtonNext).className,
    month_grid: stylex.props(calendarStyles.monthGrid).className,
    weekday: stylex.props(calendarStyles.weekday).className,
    day: stylex.props(calendarStyles.day).className,
  }
  const disabled = [
    ...(context.minValue === undefined ? [] : [{ before: getDayBoundary(context.minValue) }]),
    ...(context.maxValue === undefined ? [] : [{ after: getDayBoundary(context.maxValue) }]),
  ]
  const pendingIsInRange = isTimestampInRange(
    context.pendingValue,
    context.minValue,
    context.maxValue,
  )
  const validateTime = (): string | null => {
    if (parsedTime === undefined) return 'Use HH:MM:SS format.'
    if (
      context.pendingValue !== undefined &&
      context.minValue !== undefined &&
      context.pendingValue.getTime() < context.minValue.getTime()
    ) {
      return `Choose a date and time on or after ${formatTimestampBoundary(context.minValue)}.`
    }
    if (
      context.pendingValue !== undefined &&
      context.maxValue !== undefined &&
      context.pendingValue.getTime() > context.maxValue.getTime()
    ) {
      return `Choose a date and time on or before ${formatTimestampBoundary(context.maxValue)}.`
    }
    return null
  }
  const handleMonthChange: MonthChangeEventHandler = (month) => setVisibleMonth(month)

  return (
    <BasePopover.Portal keepMounted={keepMounted}>
      <BasePopover.Positioner
        align={align}
        sideOffset={popupPositioning.dropdownSideOffset}
        {...positionerStyles}
      >
        <BasePopover.Popup
          ref={popupRef}
          aria-label={calendarLabel}
          finalFocus={context.triggerRef}
          role="dialog"
          {...popupStyles}
        >
          <DayPicker
            autoFocus
            captionLayout="dropdown"
            classNames={classNames}
            components={{
              Chevron: CalendarChevron,
              DayButton: CalendarDayButton,
            }}
            disabled={disabled}
            endMonth={endMonth}
            fixedWeeks
            formatters={{
              formatMonthDropdown: (date) =>
                date.toLocaleString(undefined, { month: 'short' }),
            }}
            mode="single"
            month={visibleMonth}
            navLayout="around"
            required
            selected={context.pendingValue}
            showOutsideDays
            startMonth={startMonth}
            onMonthChange={handleMonthChange}
            onSelect={(day) => {
              const nextValue = combineDayAndTime(day, context.pendingTime)
              context.setPendingValue(nextValue)
              setVisibleMonth(nextValue)
            }}
          />
          <div {...stylex.props(calendarStyles.controls)}>
            <Field.Root
              disabled={context.disabled}
              validationMode="onBlur"
              validate={validateTime}
              {...stylex.props(calendarStyles.field)}
            >
              <Field.Label {...stylex.props(calendarStyles.controlLabel)}>Time</Field.Label>
              <Input
                disabled={context.disabled}
                fullWidth
                invalid={false}
                inputMode="numeric"
                size="l"
                type="text"
                value={timeInput}
                onValueChange={(nextInput) => {
                  setTimeInput(nextInput)
                  const nextParsedTime = parseTimeInput(nextInput)
                  if (nextParsedTime === undefined) return
                  const [hours, minutes, seconds] = nextParsedTime
                  const nextTime = new Date(context.pendingTime.getTime())
                  nextTime.setHours(hours, minutes, seconds, nextTime.getMilliseconds())
                  context.setPendingTime(nextTime)
                  if (context.pendingValue !== undefined) {
                    const nextValue = new Date(context.pendingValue.getTime())
                    nextValue.setHours(hours, minutes, seconds, nextValue.getMilliseconds())
                    context.setPendingValue(nextValue)
                  }
                }}
                render={<input aria-label="Time" {...stylex.props(calendarStyles.input)} />}
              />
              <Field.Error />
            </Field.Root>
            <div {...stylex.props(calendarStyles.actions)}>
              <Button
                disabled={context.disabled}
                layout="fill"
                variant="ghost"
                onClick={() => {
                  const now = new Date()
                  context.setPendingValue(now)
                  context.setPendingTime(now)
                  setTimeInput(formatTimeInput(now))
                  setVisibleMonth(now)
                }}
              >
                Set now
              </Button>
              <BasePopover.Close
                disabled={
                  context.pendingValue === undefined ||
                  context.disabled ||
                  parsedTime === undefined ||
                  pendingIsInRange === false
                }
                render={
                  <Button
                    layout="fill"
                    variant="secondary"
                  />
                }
                onClick={context.apply}
              >
                Apply
              </BasePopover.Close>
            </div>
          </div>
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
}

export const Calendar = Object.assign(CalendarRoot, {
  Root: CalendarRoot,
  Trigger: CalendarTrigger,
  Content: CalendarContent,
})
