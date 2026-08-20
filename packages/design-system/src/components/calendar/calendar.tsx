import { Popover as BasePopover } from '@base-ui/react/popover'
import * as stylex from '@stylexjs/stylex'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  type KeyboardEvent as ReactKeyboardEvent,
  type PropsWithChildren,
  type RefCallback,
  type RefObject,
} from 'react'
import {
  DayPicker,
  type DayButtonProps,
  type MonthChangeEventHandler,
} from 'react-day-picker'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { editableControlStyles } from '../../primitives/editableControl.styles'
import { popupPositioning } from '../../primitives/popupPositioning'
import { Button } from '../button/button'
import { Field } from '../field/field'
import { Input } from '../input/input'
import { InputGroupContext } from '../inputGroup/inputGroupContext'
import { calendarStyles } from './calendar.styles'

const calendarLabel = 'Choose date and time'
const yearPageSize = 20

type CalendarView = 'day' | 'month' | 'year'

interface CalendarSelectorOption {
  disabled: boolean
  label: string
  value: number
}

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
  /** Moves focus to the calendar when the content mounts. Defaults to popover content only. */
  autoFocus?: boolean
  /** Keeps the popup mounted while closed. */
  keepMounted?: boolean
  /** Renders as a popup or as an inline step inside another surface. */
  mode?: 'popover' | 'inline'
}

interface CalendarContextValue {
  disabled: boolean
  maxValue: Date | undefined
  minValue: Date | undefined
  pendingValue: Date
  resetMonth: Date
  setPendingValue: (value: Date) => void
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
  const committedTimestamp = isValidDate(value) === true ? value.getTime() : undefined
  const [pendingValue, setPendingValue] = useState<Date>(() => cloneDate(value) ?? new Date())
  const [resetMonth, setResetMonth] = useState<Date>(() => cloneDate(value) ?? new Date())
  const triggerRef = useRef<ComponentRef<typeof BasePopover.Trigger>>(null)
  useEffect(() => {
    const nextValue = committedTimestamp === undefined ? new Date() : new Date(committedTimestamp)
    setPendingValue(nextValue)
    setResetMonth(nextValue)
  }, [committedTimestamp])
  const handleOpenChange = useCallback<NonNullable<BasePopover.Root.Props['onOpenChange']>>(
    (nextOpen, eventDetails) => {
      if (nextOpen === true) {
        const nextValue = cloneDate(value) ?? new Date()
        setPendingValue(nextValue)
        setResetMonth(nextValue)
      }
      onOpenChange?.(nextOpen, eventDetails)
    },
    [onOpenChange, value],
  )
  const apply = useCallback(() => {
    onApply(new Date(pendingValue.getTime()))
  }, [onApply, pendingValue])
  const contextValue = useMemo<CalendarContextValue>(
    () => ({
      apply,
      disabled,
      maxValue,
      minValue,
      pendingValue,
      resetMonth,
      setPendingValue,
      triggerRef,
    }),
    [apply, disabled, maxValue, minValue, pendingValue, resetMonth],
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
    const inputGroup = useContext(InputGroupContext)
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
      render === undefined && inputGroup !== null && calendarStyles.triggerGrouped,
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
        data-grouped={render === undefined && inputGroup !== null ? '' : undefined}
      >
        {children}
      </BasePopover.Trigger>
    )
  },
)

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

function CalendarHiddenMonthCaption(): React.ReactElement {
  return <div hidden />
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

function combineDayAndTime(day: Date, time: Date): Date {
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

function getMonthIndex(value: Date): number {
  return value.getFullYear() * 12 + value.getMonth()
}

function getMonthFromIndex(monthIndex: number): Date {
  return new Date(Math.floor(monthIndex / 12), monthIndex % 12, 1)
}

function clampMonth(value: Date, startMonth: Date, endMonth: Date): Date {
  const monthIndex = Math.min(
    Math.max(getMonthIndex(value), getMonthIndex(startMonth)),
    getMonthIndex(endMonth),
  )
  return getMonthFromIndex(monthIndex)
}

function getYearPageStart(year: number, startYear: number, endYear: number): number {
  const boundedYear = Math.min(Math.max(year, startYear), endYear)
  return startYear + Math.floor((boundedYear - startYear) / yearPageSize) * yearPageSize
}

function getEnabledOptionIndex(
  options: CalendarSelectorOption[],
  initialIndex: number,
  step: number,
  boundaryIndex: number,
): number {
  let optionIndex = initialIndex
  while (
    optionIndex >= 0 &&
    optionIndex < options.length &&
    (step > 0 ? optionIndex <= boundaryIndex : optionIndex >= boundaryIndex)
  ) {
    if (options[optionIndex]?.disabled === false) return optionIndex
    optionIndex += step
  }
  return -1
}

interface CalendarSelectorGridProps {
  columns: 3 | 5
  label: string
  options: CalendarSelectorOption[]
  selectedValue: number
  onSelect: (value: number) => void
}

function CalendarSelectorGrid({
  columns,
  label,
  options,
  selectedValue,
  onSelect,
}: CalendarSelectorGridProps): React.ReactElement {
  const optionRefs = useRef(new Map<number, HTMLButtonElement>())
  const initialFocusedValue =
    options.find((option) => option.value === selectedValue && option.disabled === false)?.value ??
    options.find((option) => option.disabled === false)?.value
  const [focusedValue, setFocusedValue] = useState<number | undefined>(
    initialFocusedValue,
  )

  useEffect(() => {
    if (initialFocusedValue !== undefined) {
      optionRefs.current.get(initialFocusedValue)?.focus()
    }
  }, [initialFocusedValue])

  const focusOption = (optionIndex: number): void => {
    const option = options[optionIndex]
    if (option === undefined || option.disabled === true) return
    setFocusedValue(option.value)
    optionRefs.current.get(option.value)?.focus()
  }
  const handleOptionKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    optionIndex: number,
  ): void => {
    const rowStart = Math.floor(optionIndex / columns) * columns
    const rowEnd = Math.min(rowStart + columns - 1, options.length - 1)
    let nextIndex = -1
    if (event.key === 'ArrowLeft') {
      nextIndex = getEnabledOptionIndex(options, optionIndex - 1, -1, rowStart)
    } else if (event.key === 'ArrowRight') {
      nextIndex = getEnabledOptionIndex(options, optionIndex + 1, 1, rowEnd)
    } else if (event.key === 'ArrowUp') {
      nextIndex = getEnabledOptionIndex(options, optionIndex - columns, -columns, 0)
    } else if (event.key === 'ArrowDown') {
      nextIndex = getEnabledOptionIndex(
        options,
        optionIndex + columns,
        columns,
        options.length - 1,
      )
    } else if (event.key === 'Home') {
      nextIndex = getEnabledOptionIndex(
        options,
        event.ctrlKey === true ? 0 : rowStart,
        1,
        event.ctrlKey === true ? options.length - 1 : rowEnd,
      )
    } else if (event.key === 'End') {
      nextIndex = getEnabledOptionIndex(
        options,
        event.ctrlKey === true ? options.length - 1 : rowEnd,
        -1,
        event.ctrlKey === true ? 0 : rowStart,
      )
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      const option = options[optionIndex]
      if (option?.disabled === false) onSelect(option.value)
      return
    } else {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (nextIndex !== -1) focusOption(nextIndex)
  }
  const rows = Array.from({ length: Math.ceil(options.length / columns) }, (_, rowIndex) =>
    options.slice(rowIndex * columns, rowIndex * columns + columns),
  )

  return (
    <div aria-label={label} role="grid" {...stylex.props(calendarStyles.selectorGrid)}>
      {rows.map((row, rowIndex) => (
        <div
          key={row[0]?.value ?? rowIndex}
          role="row"
          {...stylex.props(
            calendarStyles.selectorRow,
            columns === 3 && calendarStyles.selectorRowMonths,
            columns === 5 && calendarStyles.selectorRowYears,
          )}
        >
          {row.map((option, columnIndex) => {
            const optionIndex = rowIndex * columns + columnIndex
            const selected = option.value === selectedValue
            return (
              <div key={option.value} aria-selected={selected} role="gridcell">
                <button
                  ref={(element) => {
                    if (element === null) optionRefs.current.delete(option.value)
                    else optionRefs.current.set(option.value, element)
                  }}
                  disabled={option.disabled}
                  tabIndex={option.value === focusedValue ? 0 : -1}
                  type="button"
                  {...stylex.props(
                    calendarStyles.selectorButton,
                    selected && calendarStyles.selectorButtonSelected,
                  )}
                  onClick={() => onSelect(option.value)}
                  onFocus={() => setFocusedValue(option.value)}
                  onKeyDown={(event) => handleOptionKeyDown(event, optionIndex)}
                >
                  {option.label}
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
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

function CalendarContent({
  align = 'start',
  autoFocus,
  keepMounted = false,
  mode = 'popover',
}: CalendarContentProps): React.ReactElement {
  const context = useCalendarContext()
  const popupRef = useRef<ComponentRef<typeof BasePopover.Popup>>(null)
  const [visibleMonth, setVisibleMonth] = useState(() => context.pendingValue ?? new Date())
  const [view, setView] = useState<CalendarView>('day')
  const [dayGridAutoFocus, setDayGridAutoFocus] = useState(true)
  const [timeInput, setTimeInput] = useState(() => formatTimeInput(context.pendingValue))
  const monthButtonRef = useRef<HTMLButtonElement>(null)
  const yearButtonRef = useRef<HTMLButtonElement>(null)
  const parsedTime = parseTimeInput(timeInput)
  useEffect(() => setTimeInput(formatTimeInput(context.pendingValue)), [context.pendingValue])
  useEffect(() => {
    setVisibleMonth(context.resetMonth)
    setView('day')
    setDayGridAutoFocus(true)
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
  const startYear = startMonth.getFullYear()
  const endYear = endMonth.getFullYear()
  const startMonthIndex = getMonthIndex(startMonth)
  const endMonthIndex = getMonthIndex(endMonth)
  const [yearPageStart, setYearPageStart] = useState(() =>
    getYearPageStart(visibleMonth.getFullYear(), startYear, endYear),
  )
  const classNames = {
    root: stylex.props(calendarStyles.calendarRoot).className,
    months: stylex.props(calendarStyles.months).className,
    month: stylex.props(calendarStyles.month).className,
    month_grid: stylex.props(calendarStyles.monthGrid).className,
    weekday: stylex.props(calendarStyles.weekday).className,
    day: stylex.props(calendarStyles.day).className,
  }
  const disabled = context.disabled
    ? true
    : [
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
  const handleMonthChange: MonthChangeEventHandler = (month) => setVisibleMonth(month)
  const applyDisabled =
    context.disabled || parsedTime === undefined || pendingIsInRange === false
  const visibleMonthIndex = getMonthIndex(visibleMonth)
  const monthOptions = Array.from({ length: 12 }, (_, month) => {
    const value = new Date(visibleMonth.getFullYear(), month, 1)
    const monthIndex = getMonthIndex(value)
    return {
      disabled:
        context.disabled === true ||
        monthIndex < startMonthIndex ||
        monthIndex > endMonthIndex,
      label: value.toLocaleString(undefined, { month: 'long' }),
      value: month,
    }
  })
  const yearOptions = Array.from(
    { length: Math.max(0, Math.min(yearPageSize, endYear - yearPageStart + 1)) },
    (_, index) => {
      const year = yearPageStart + index
      return { disabled: context.disabled, label: String(year), value: year }
    },
  )
  const previousNavigationDisabled =
    context.disabled === true ||
    view === 'month' ||
    (view === 'day' && visibleMonthIndex <= startMonthIndex) ||
    (view === 'year' && yearPageStart <= startYear)
  const nextNavigationDisabled =
    context.disabled === true ||
    view === 'month' ||
    (view === 'day' && visibleMonthIndex >= endMonthIndex) ||
    (view === 'year' && yearPageStart + yearPageSize > endYear)
  const navigationLabel =
    view === 'year'
      ? { next: 'Show next 20 years', previous: 'Show previous 20 years' }
      : { next: 'Go to the Next Month', previous: 'Go to the Previous Month' }
  const handleNavigation = (direction: -1 | 1): void => {
    if (view === 'day') {
      setVisibleMonth(getMonthFromIndex(visibleMonthIndex + direction))
    } else if (view === 'year') {
      setYearPageStart((pageStart) => pageStart + direction * yearPageSize)
    }
  }
  const closeSelector = (nextMonth: Date, trigger: RefObject<HTMLButtonElement | null>): void => {
    setVisibleMonth(clampMonth(nextMonth, startMonth, endMonth))
    trigger.current?.focus()
    setView('day')
  }
  const calendarNavigation = (
    <div {...stylex.props(calendarStyles.calendarHeader)}>
      <button
        aria-label={navigationLabel.previous}
        disabled={previousNavigationDisabled}
        type="button"
        {...stylex.props(calendarStyles.navButton)}
        onClick={() => handleNavigation(-1)}
      >
        <ChevronLeft {...stylex.props(calendarStyles.chevron)} aria-hidden strokeWidth={1.5} />
      </button>
      <div {...stylex.props(calendarStyles.headerLabels)}>
        <button
          ref={monthButtonRef}
          aria-label={`Choose month, ${visibleMonth.toLocaleString(undefined, { month: 'long' })}`}
          aria-pressed={view === 'month'}
          disabled={context.disabled}
          type="button"
          {...stylex.props(
            calendarStyles.headerButton,
            view === 'month' && calendarStyles.headerButtonSelected,
          )}
          onClick={() => {
            setDayGridAutoFocus(false)
            setView((currentView) => (currentView === 'month' ? 'day' : 'month'))
          }}
        >
          {visibleMonth.toLocaleString(undefined, { month: 'long' })}
        </button>
        <button
          ref={yearButtonRef}
          aria-label={`Choose year, ${visibleMonth.getFullYear()}`}
          aria-pressed={view === 'year'}
          disabled={context.disabled}
          type="button"
          {...stylex.props(
            calendarStyles.headerButton,
            view === 'year' && calendarStyles.headerButtonSelected,
          )}
          onClick={() => {
            if (view === 'year') {
              setView('day')
              return
            }
            setYearPageStart(getYearPageStart(visibleMonth.getFullYear(), startYear, endYear))
            setDayGridAutoFocus(false)
            setView('year')
          }}
        >
          {visibleMonth.getFullYear()}
        </button>
      </div>
      <button
        aria-label={navigationLabel.next}
        disabled={nextNavigationDisabled}
        type="button"
        {...stylex.props(calendarStyles.navButton)}
        onClick={() => handleNavigation(1)}
      >
        <ChevronRight {...stylex.props(calendarStyles.chevron)} aria-hidden strokeWidth={1.5} />
      </button>
    </div>
  )
  const calendarBody = (
    <>
      <div
        {...stylex.props(calendarStyles.calendarSurface)}
        onKeyDownCapture={(event) => {
          if (event.key !== 'Escape' || view === 'day') return
          event.preventDefault()
          event.stopPropagation()
          if (view === 'month') monthButtonRef.current?.focus()
          else yearButtonRef.current?.focus()
          setView('day')
        }}
      >
        {calendarNavigation}
        <div
          aria-atomic="true"
          aria-live="polite"
          role="status"
          {...stylex.props(calendarStyles.visuallyHidden)}
        >
          {view === 'year'
            ? `Years ${yearPageStart} to ${Math.min(yearPageStart + yearPageSize - 1, endYear)}`
            : visibleMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <div
          {...stylex.props(
            calendarStyles.calendarView,
            view !== 'day' && calendarStyles.calendarViewSelector,
          )}
        >
          {view === 'day' ? (
            <DayPicker
              // oxlint-disable-next-line jsx-a11y/no-autofocus -- Popovers and explicit command steps transfer focus into the calendar.
              autoFocus={(autoFocus ?? mode === 'popover') && dayGridAutoFocus}
              classNames={classNames}
              components={{
                DayButton: CalendarDayButton,
                MonthCaption: CalendarHiddenMonthCaption,
              }}
              disabled={disabled}
              endMonth={endMonth}
              fixedWeeks
              hideNavigation
              mode="single"
              month={visibleMonth}
              required
              selected={context.pendingValue}
              showOutsideDays
              startMonth={startMonth}
              onMonthChange={handleMonthChange}
              onSelect={(day) => {
                const nextValue = combineDayAndTime(day, context.pendingValue)
                context.setPendingValue(nextValue)
                setVisibleMonth(nextValue)
              }}
            />
          ) : view === 'month' ? (
            <CalendarSelectorGrid
              key="month"
              columns={3}
              label="Choose month"
              options={monthOptions}
              selectedValue={visibleMonth.getMonth()}
              onSelect={(month) =>
                closeSelector(
                  new Date(visibleMonth.getFullYear(), month, 1),
                  monthButtonRef,
                )
              }
            />
          ) : (
            <CalendarSelectorGrid
              key={`year-${yearPageStart}`}
              columns={5}
              label="Choose year"
              options={yearOptions}
              selectedValue={visibleMonth.getFullYear()}
              onSelect={(year) =>
                closeSelector(new Date(year, visibleMonth.getMonth(), 1), yearButtonRef)
              }
            />
          )}
        </div>
      </div>
      {view === 'day' && (
        <div {...stylex.props(calendarStyles.controls)}>
          <div {...stylex.props(calendarStyles.timeRow)}>
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
                render={<input aria-label="Time" {...stylex.props(calendarStyles.input)} />}
              />
              <Field.Error />
            </Field.Root>
            <div {...stylex.props(calendarStyles.setNowAction)}>
              <Button
                disabled={context.disabled}
                layout="fill"
                size="m"
                variant="ghost"
                onClick={() => {
                  const now = new Date()
                  context.setPendingValue(now)
                  setTimeInput(formatTimeInput(now))
                  setVisibleMonth(now)
                }}
              >
                Set now
              </Button>
            </div>
          </div>
          <div {...stylex.props(calendarStyles.applyAction)}>
            {mode === 'inline' ? (
              <Button
                disabled={applyDisabled}
                layout="fill"
                size="s"
                variant="secondary"
                onClick={context.apply}
              >
                Apply
              </Button>
            ) : (
              <BasePopover.Close
                disabled={applyDisabled}
                render={<Button layout="fill" size="s" variant="secondary" />}
                onClick={context.apply}
              >
                Apply
              </BasePopover.Close>
            )}
          </div>
        </div>
      )}
    </>
  )

  if (mode === 'inline') {
    return (
      <div
        aria-label={calendarLabel}
        role="group"
        {...stylex.props(calendarStyles.inlinePanel)}
      >
        {calendarBody}
      </div>
    )
  }

  return (
    <BasePopover.Portal keepMounted={keepMounted}>
      <InputGroupContext.Provider value={null}>
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
            {calendarBody}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </InputGroupContext.Provider>
    </BasePopover.Portal>
  )
}

export const Calendar = Object.assign(CalendarRoot, {
  Root: CalendarRoot,
  Trigger: CalendarTrigger,
  Content: CalendarContent,
})
