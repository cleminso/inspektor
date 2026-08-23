import * as stylex from '@stylexjs/stylex'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react'
import { DayPicker, type DayButtonProps, type MonthChangeEventHandler } from 'react-day-picker'

import { calendarStyles } from './calendar.styles'

const yearPageSize = 20

export type CalendarView = 'day' | 'month' | 'year'

interface CalendarSelectorOption {
  disabled: boolean
  label: string
  value: number
}

export interface CalendarProps {
  /** The selected date. */
  value?: Date
  /** The initially selected date when uncontrolled. */
  defaultValue?: Date
  /** Runs when the selected date changes. */
  onValueChange?: (value: Date | undefined) => void
  /** Earliest selectable date. */
  minValue?: Date
  /** Latest selectable date. */
  maxValue?: Date
  /** Disables date selection and calendar navigation. */
  disabled?: boolean
  /** Moves focus to the selected date when the calendar mounts. */
  autoFocus?: boolean
}

interface CalendarSurfaceProps extends CalendarProps {
  required?: boolean
  resetValue?: Date
  onViewChange?: (view: CalendarView) => void
}

function isValidDate(value: Date | undefined): value is Date {
  return value !== undefined && Number.isFinite(value.getTime()) === true
}

function cloneDate(value: Date | undefined): Date | undefined {
  return isValidDate(value) === true ? new Date(value.getTime()) : undefined
}

function createLocalDate(year: number, month: number, day = 1): Date {
  const value = new Date(0)
  value.setHours(0, 0, 0, 0)
  value.setFullYear(year, month, day)
  return value
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

function CalendarHiddenMonthCaption(): React.ReactElement {
  return <div hidden />
}

function getYearBoundary(value: Date | undefined, fallbackYear: number): Date {
  return value ?? createLocalDate(fallbackYear, 0)
}

function getDayBoundary(value: Date): Date {
  const boundary = new Date(value.getTime())
  boundary.setHours(0, 0, 0, 0)
  return boundary
}

function getMonthIndex(value: Date): number {
  return value.getFullYear() * 12 + value.getMonth()
}

function getMonthFromIndex(monthIndex: number): Date {
  return createLocalDate(Math.floor(monthIndex / 12), monthIndex % 12)
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
  const [focusedValue, setFocusedValue] = useState<number | undefined>(initialFocusedValue)

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
      nextIndex = getEnabledOptionIndex(options, optionIndex + columns, columns, options.length - 1)
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
    <div
      aria-label={label}
      role="grid"
      {...stylex.props(calendarStyles.selectorGrid)}
    >
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
              <div
                key={option.value}
                aria-selected={selected}
                role="gridcell"
              >
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

function CalendarSurface(props: CalendarSurfaceProps): React.ReactElement {
  const isControlled = Object.hasOwn(props, 'value')
  const {
    value,
    defaultValue,
    onValueChange,
    minValue,
    maxValue,
    disabled = false,
    autoFocus = false,
    required = false,
    resetValue,
    onViewChange,
  } = props
  const [uncontrolledValue, setUncontrolledValue] = useState(() => cloneDate(defaultValue))
  const selectedValue = isControlled ? value : uncontrolledValue
  const selectedTimestamp = selectedValue?.getTime()
  const initialMonth = cloneDate(resetValue) ?? cloneDate(selectedValue) ?? new Date()
  const [visibleMonth, setVisibleMonth] = useState(initialMonth)
  const [view, setViewState] = useState<CalendarView>('day')
  const [dayGridAutoFocus, setDayGridAutoFocus] = useState(true)
  const monthButtonRef = useRef<HTMLButtonElement>(null)
  const yearButtonRef = useRef<HTMLButtonElement>(null)

  const setView = (nextView: CalendarView): void => {
    setViewState(nextView)
    onViewChange?.(nextView)
  }

  useEffect(() => {
    const nextMonth =
      cloneDate(resetValue) ??
      (selectedTimestamp === undefined ? undefined : new Date(selectedTimestamp))
    if (nextMonth !== undefined) setVisibleMonth(nextMonth)
    setViewState('day')
    onViewChange?.('day')
    setDayGridAutoFocus(true)
  }, [onViewChange, resetValue, selectedTimestamp])

  const nowYear = new Date().getFullYear()
  const startMonth = getYearBoundary(minValue, nowYear - 100)
  const endMonth = getYearBoundary(maxValue, nowYear + 100)
  const startYear = startMonth.getFullYear()
  const endYear = endMonth.getFullYear()
  const startMonthIndex = getMonthIndex(startMonth)
  const endMonthIndex = getMonthIndex(endMonth)
  const [yearPageStart, setYearPageStart] = useState(() =>
    getYearPageStart(visibleMonth.getFullYear(), startYear, endYear),
  )
  const visibleMonthIndex = getMonthIndex(visibleMonth)
  const classNames = {
    root: stylex.props(calendarStyles.calendarRoot).className,
    months: stylex.props(calendarStyles.months).className,
    month: stylex.props(calendarStyles.month).className,
    month_grid: stylex.props(calendarStyles.monthGrid).className,
    weekday: stylex.props(calendarStyles.weekday).className,
    day: stylex.props(calendarStyles.day).className,
  }
  const dayDisabled = disabled
    ? true
    : [
        ...(minValue === undefined ? [] : [{ before: getDayBoundary(minValue) }]),
        ...(maxValue === undefined ? [] : [{ after: getDayBoundary(maxValue) }]),
      ]
  const monthOptions = Array.from({ length: 12 }, (_, month) => {
    const optionValue = createLocalDate(visibleMonth.getFullYear(), month)
    const monthIndex = getMonthIndex(optionValue)
    return {
      disabled: disabled === true || monthIndex < startMonthIndex || monthIndex > endMonthIndex,
      label: optionValue.toLocaleString(undefined, { month: 'long' }),
      value: month,
    }
  })
  const yearOptions = Array.from(
    { length: Math.max(0, Math.min(yearPageSize, endYear - yearPageStart + 1)) },
    (_, index) => {
      const year = yearPageStart + index
      return { disabled, label: String(year), value: year }
    },
  )
  const previousNavigationDisabled =
    disabled === true ||
    view === 'month' ||
    (view === 'day' && visibleMonthIndex <= startMonthIndex) ||
    (view === 'year' && yearPageStart <= startYear)
  const nextNavigationDisabled =
    disabled === true ||
    view === 'month' ||
    (view === 'day' && visibleMonthIndex >= endMonthIndex) ||
    (view === 'year' && yearPageStart + yearPageSize > endYear)
  const navigationLabel =
    view === 'year'
      ? { next: 'Show next 20 years', previous: 'Show previous 20 years' }
      : { next: 'Go to the Next Month', previous: 'Go to the Previous Month' }
  const handleNavigation = (direction: -1 | 1): void => {
    if (view === 'day') setVisibleMonth(getMonthFromIndex(visibleMonthIndex + direction))
    else if (view === 'year') {
      setYearPageStart((pageStart) => pageStart + direction * yearPageSize)
    }
  }
  const closeSelector = (nextMonth: Date, trigger: RefObject<HTMLButtonElement | null>): void => {
    setVisibleMonth(clampMonth(nextMonth, startMonth, endMonth))
    trigger.current?.focus()
    setView('day')
  }
  const handleMonthChange: MonthChangeEventHandler = (month) => setVisibleMonth(month)

  return (
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
      <div {...stylex.props(calendarStyles.calendarHeader)}>
        <button
          aria-label={navigationLabel.previous}
          disabled={previousNavigationDisabled}
          type="button"
          {...stylex.props(calendarStyles.navButton)}
          onClick={() => handleNavigation(-1)}
        >
          <ChevronLeft
            {...stylex.props(calendarStyles.chevron)}
            aria-hidden
            strokeWidth={1.5}
          />
        </button>
        <div {...stylex.props(calendarStyles.headerLabels)}>
          <button
            ref={monthButtonRef}
            aria-label={`Choose month, ${visibleMonth.toLocaleString(undefined, { month: 'long' })}`}
            aria-pressed={view === 'month'}
            disabled={disabled}
            type="button"
            {...stylex.props(
              calendarStyles.headerButton,
              view === 'month' && calendarStyles.headerButtonSelected,
            )}
            onClick={() => {
              setDayGridAutoFocus(false)
              setView(view === 'month' ? 'day' : 'month')
            }}
          >
            {visibleMonth.toLocaleString(undefined, { month: 'long' })}
          </button>
          <button
            ref={yearButtonRef}
            aria-label={`Choose year, ${visibleMonth.getFullYear()}`}
            aria-pressed={view === 'year'}
            disabled={disabled}
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
          <ChevronRight
            {...stylex.props(calendarStyles.chevron)}
            aria-hidden
            strokeWidth={1.5}
          />
        </button>
      </div>
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
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- Explicit picker steps transfer focus into the calendar.
            autoFocus={autoFocus && dayGridAutoFocus}
            classNames={classNames}
            components={{
              DayButton: CalendarDayButton,
              MonthCaption: CalendarHiddenMonthCaption,
            }}
            disabled={dayDisabled}
            endMonth={endMonth}
            fixedWeeks
            hideNavigation
            mode="single"
            month={visibleMonth}
            required={required}
            selected={selectedValue}
            showOutsideDays
            startMonth={startMonth}
            onMonthChange={handleMonthChange}
            onSelect={(nextValue: Date | undefined) => {
              if (isControlled === false) setUncontrolledValue(cloneDate(nextValue))
              onValueChange?.(cloneDate(nextValue))
              if (nextValue !== undefined) setVisibleMonth(nextValue)
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
              closeSelector(createLocalDate(visibleMonth.getFullYear(), month), monthButtonRef)
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
              closeSelector(createLocalDate(year, visibleMonth.getMonth()), yearButtonRef)
            }
          />
        )}
      </div>
    </div>
  )
}

export function Calendar(props: CalendarProps): React.ReactElement {
  return (
    <div {...stylex.props(calendarStyles.standalone)}>
      <CalendarSurface {...props} />
    </div>
  )
}

export { CalendarSurface }
