import { Popover as BasePopover } from '@base-ui/react/popover'
import * as stylex from '@stylexjs/stylex'
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

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { editableControlStyles } from '../../primitives/editableControl.styles'
import { popupPositioning } from '../../primitives/popupPositioning'
import { InputGroupContext } from '../inputGroup/inputGroupContext'
import { datePickerStyles } from './datePicker.styles'

const datePickerLabel = 'Choose date and time'

export interface DatePickerRootProps extends PropsWithChildren {
  /** The committed timestamp shown when the picker opens. */
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

export type DatePickerTriggerProps = PropsWithChildren<
  Omit<BasePopover.Trigger.Props, 'aria-label' | 'className' | 'disabled' | 'style'> & {
    /** Stable accessible name for the timestamp trigger. */
    label: string
    /** Composes trigger behavior onto another native button component. */
    render?: BasePopover.Trigger.Props['render']
  }
>

export interface DatePickerContentProps {
  /** Aligns the popup along its trigger. */
  align?: BasePopover.Positioner.Props['align']
  /** Moves focus to the calendar when the content mounts. */
  autoFocus?: boolean
  /** Keeps the popup mounted while closed. */
  keepMounted?: boolean
}

export interface DatePickerPanelProps {
  /** Moves focus to the calendar when the panel mounts. */
  autoFocus?: boolean
}

export interface DatePickerContextValue {
  disabled: boolean
  maxValue: Date | undefined
  minValue: Date | undefined
  pendingValue: Date
  resetValue: Date
  setPendingValue: (value: Date) => void
  apply: () => void
  triggerRef: RefObject<ComponentRef<typeof BasePopover.Trigger> | null>
}

type DatePickerCalendarModule = typeof import('./datePickerCalendar')

let datePickerCalendarPromise: Promise<DatePickerCalendarModule> | null = null
let loadedDatePickerCalendar: DatePickerCalendarModule | null = null

// Keep react-day-picker outside the static application graph. The bounded fallback preserves the
// popup footprint while the optional calendar implementation loads and later mounts in its place.
function loadDatePickerCalendar(): Promise<DatePickerCalendarModule> {
  datePickerCalendarPromise ??= import('./datePickerCalendar')
    .then((module) => {
      loadedDatePickerCalendar = module
      return module
    })
    .catch((error: unknown) => {
      datePickerCalendarPromise = null
      throw new Error('DatePicker failed to load calendar', { cause: error })
    })

  return datePickerCalendarPromise
}

export function preloadDatePickerCalendar(): Promise<void> {
  return loadDatePickerCalendar().then(
    () => undefined,
    () => undefined,
  )
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null)

function useDatePickerContext(): DatePickerContextValue {
  const context = useContext(DatePickerContext)
  if (context === null) {
    throw new Error('DatePicker parts must be rendered inside DatePicker.')
  }
  return context
}

function isValidDate(value: Date | undefined): value is Date {
  return value !== undefined && Number.isFinite(value.getTime()) === true
}

function cloneDate(value: Date | undefined): Date | undefined {
  return isValidDate(value) === true ? new Date(value.getTime()) : undefined
}

function DatePickerRoot({
  children,
  value,
  onApply,
  open,
  defaultOpen = false,
  onOpenChange,
  minValue,
  maxValue,
  disabled = false,
}: DatePickerRootProps): React.ReactElement {
  const committedTimestamp = isValidDate(value) === true ? value.getTime() : undefined
  const [pendingValue, setPendingValue] = useState<Date>(() => cloneDate(value) ?? new Date())
  const [resetValue, setResetValue] = useState<Date>(() => cloneDate(value) ?? new Date())
  const triggerRef = useRef<ComponentRef<typeof BasePopover.Trigger>>(null)
  useEffect(() => {
    const nextValue = committedTimestamp === undefined ? new Date() : new Date(committedTimestamp)
    setPendingValue(nextValue)
    setResetValue(nextValue)
  }, [committedTimestamp])
  const handleOpenChange = useCallback<NonNullable<BasePopover.Root.Props['onOpenChange']>>(
    (nextOpen, eventDetails) => {
      if (nextOpen === true) {
        void preloadDatePickerCalendar()
        const nextValue = cloneDate(value) ?? new Date()
        setPendingValue(nextValue)
        setResetValue(nextValue)
      }
      onOpenChange?.(nextOpen, eventDetails)
    },
    [onOpenChange, value],
  )
  const apply = useCallback(() => {
    onApply(new Date(pendingValue.getTime()))
  }, [onApply, pendingValue])
  const contextValue = useMemo<DatePickerContextValue>(
    () => ({
      apply,
      disabled,
      maxValue,
      minValue,
      pendingValue,
      resetValue,
      setPendingValue,
      triggerRef,
    }),
    [apply, disabled, maxValue, minValue, pendingValue, resetValue],
  )

  return (
    <DatePickerContext.Provider value={contextValue}>
      <BasePopover.Root
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={handleOpenChange}
      >
        {children}
      </BasePopover.Root>
    </DatePickerContext.Provider>
  )
}

const DatePickerTrigger = forwardRef<
  ComponentRef<typeof BasePopover.Trigger>,
  DatePickerTriggerProps
>(function DatePickerTrigger({ label, render, children, ...props }, forwardedRef) {
  const context = useDatePickerContext()
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
    render === undefined && datePickerStyles.trigger,
    render === undefined && editableControlStyles.focusVisible,
    render === undefined && inputGroup !== null && editableControlStyles.groupedMember,
    state.open === true && datePickerStyles.triggerOpen,
    state.open === false && datePickerStyles.triggerClosed,
    state.disabled === true && datePickerStyles.triggerDisabled,
  ])

  return (
    <BasePopover.Trigger
      {...props}
      ref={triggerRef as BasePopover.Trigger.Props['ref']}
      aria-label={label}
      disabled={context.disabled}
      render={render}
      {...triggerStyles}
      data-slot={render === undefined ? 'date-picker-trigger' : undefined}
      data-grouped={render === undefined && inputGroup !== null ? '' : undefined}
    >
      {children}
    </BasePopover.Trigger>
  )
})

function DatePickerPanelBody({
  autoFocus,
  closeOnApply,
}: {
  autoFocus: boolean
  closeOnApply: boolean
}): React.ReactElement {
  const context = useDatePickerContext()
  const [implementation, setImplementation] = useState<DatePickerCalendarModule | null>(
    loadedDatePickerCalendar,
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const shouldAutoFocusRef = useRef(loadedDatePickerCalendar !== null && autoFocus)

  useEffect(() => {
    if (implementation === null && autoFocus === true) loadingRef.current?.focus()
  }, [autoFocus, implementation])

  useEffect(() => {
    if (implementation !== null) return
    let active = true

    void loadDatePickerCalendar()
      .then((module) => {
        if (active === true) {
          shouldAutoFocusRef.current =
            autoFocus === true && document.activeElement === loadingRef.current
          setImplementation(module)
        }
      })
      .catch((error: unknown) => {
        if (active === true)
          setLoadError(
            error instanceof Error ? error.message : 'DatePicker failed to load calendar',
          )
      })

    return () => {
      active = false
    }
  }, [autoFocus, implementation])

  if (implementation === null) {
    return (
      <div
        {...stylex.props(datePickerStyles.loading)}
        ref={loadingRef}
        aria-label={loadError === null ? 'Loading date picker' : undefined}
        role={loadError === null ? 'status' : 'alert'}
        tabIndex={autoFocus === true ? -1 : undefined}
      >
        {loadError ?? 'Loading calendar…'}
      </div>
    )
  }

  const DatePickerCalendar = implementation.DatePickerCalendar
  return (
    <DatePickerCalendar
      autoFocus={shouldAutoFocusRef.current}
      closeOnApply={closeOnApply}
      context={context}
    />
  )
}

function DatePickerPanel({ autoFocus = false }: DatePickerPanelProps): React.ReactElement {
  return (
    <div
      aria-label={datePickerLabel}
      role="group"
      {...stylex.props(datePickerStyles.inlinePanel)}
    >
      {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- Explicit picker steps transfer focus into the calendar. */}
      <DatePickerPanelBody
        autoFocus={autoFocus}
        closeOnApply={false}
      />
    </div>
  )
}

function DatePickerContent({
  align = 'start',
  autoFocus = true,
  keepMounted = false,
}: DatePickerContentProps): React.ReactElement {
  const context = useDatePickerContext()
  const positionerStyles = createStateStyleProps<BasePopover.Positioner.State>((state) => [
    datePickerStyles.positioner,
    state.open === true && datePickerStyles.positionerOpen,
    state.open === false && datePickerStyles.positionerClosed,
    state.anchorHidden === true && datePickerStyles.positionerAnchorHidden,
    state.instant !== undefined && datePickerStyles.positionerInstant,
    state.side === 'top' && datePickerStyles.positionerSideTop,
    state.side === 'bottom' && datePickerStyles.positionerSideBottom,
    state.side === 'left' && datePickerStyles.positionerSideLeft,
    state.side === 'right' && datePickerStyles.positionerSideRight,
    state.side === 'inline-start' && datePickerStyles.positionerSideInlineStart,
    state.side === 'inline-end' && datePickerStyles.positionerSideInlineEnd,
    state.align === 'start' && datePickerStyles.positionerAlignStart,
    state.align === 'center' && datePickerStyles.positionerAlignCenter,
    state.align === 'end' && datePickerStyles.positionerAlignEnd,
  ])
  const popupStyles = createStateStyleProps<BasePopover.Popup.State>((state) => [
    datePickerStyles.popup,
    state.open === true && datePickerStyles.popupOpen,
    state.open === false && datePickerStyles.popupClosed,
    state.transitionStatus === 'starting' && datePickerStyles.popupStarting,
    state.transitionStatus === 'ending' && datePickerStyles.popupEnding,
    state.instant !== undefined && datePickerStyles.popupInstant,
    state.side === 'top' && datePickerStyles.popupSideTop,
    state.side === 'bottom' && datePickerStyles.popupSideBottom,
    state.side === 'left' && datePickerStyles.popupSideLeft,
    state.side === 'right' && datePickerStyles.popupSideRight,
    state.side === 'inline-start' && datePickerStyles.popupSideInlineStart,
    state.side === 'inline-end' && datePickerStyles.popupSideInlineEnd,
    state.align === 'start' && datePickerStyles.popupAlignStart,
    state.align === 'center' && datePickerStyles.popupAlignCenter,
    state.align === 'end' && datePickerStyles.popupAlignEnd,
  ])

  return (
    <BasePopover.Portal keepMounted={keepMounted}>
      <InputGroupContext.Provider value={null}>
        <BasePopover.Positioner
          align={align}
          sideOffset={popupPositioning.dropdownSideOffset}
          {...positionerStyles}
        >
          <BasePopover.Popup
            aria-label={datePickerLabel}
            finalFocus={context.triggerRef}
            role="dialog"
            {...popupStyles}
          >
            <DatePickerPanelBody
              autoFocus={autoFocus}
              closeOnApply
            />
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </InputGroupContext.Provider>
    </BasePopover.Portal>
  )
}

export const DatePicker = Object.assign(DatePickerRoot, {
  Root: DatePickerRoot,
  Trigger: DatePickerTrigger,
  Content: DatePickerContent,
  Panel: DatePickerPanel,
})
