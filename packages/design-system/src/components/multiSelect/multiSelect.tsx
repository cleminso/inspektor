import { Popover as BasePopover } from '@base-ui/react/popover'
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  type ComponentRef,
  type PropsWithChildren,
  type RefCallback,
  type RefObject,
} from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { popupPositioning } from '../../primitives/popupPositioning'
import { Button } from '../button/button'
import {
  CheckboxGroup,
  CheckboxGroupListPrivate,
  useCheckboxGroupNavigation,
  type CheckboxGroupItem,
} from '../checkboxGroup/checkboxGroup'
import { ScrollAreaPrivate } from '../scrollArea/scrollArea'
import { multiSelectStyles } from './multiSelect.styles'

const deferredRenderingThreshold = 50

export interface MultiSelectItem extends CheckboxGroupItem {}

export type MultiSelectRootProps = PropsWithChildren<{
  /** Known options displayed by the popup. */
  items: readonly MultiSelectItem[]
  /** Controlled selected values. */
  value?: readonly string[]
  /** Initially selected values when uncontrolled. */
  defaultValue?: readonly string[]
  /** Runs when the selected values change. */
  onValueChange?: (value: string[]) => void
  /** Whether the popup is initially open. */
  defaultOpen?: boolean
  /** Whether the popup is open. */
  open?: boolean
  /** Runs when the popup opens or closes. */
  onOpenChange?: BasePopover.Root.Props['onOpenChange']
  /** Disables the trigger and every mutable option. */
  disabled?: boolean
}>

export type MultiSelectTriggerProps = PropsWithChildren<
  Omit<BasePopover.Trigger.Props, 'aria-label' | 'children' | 'className' | 'style'> & {
    /** Stable accessible name for the trigger. */
    label: string
    /** Composes trigger behavior onto another native button. */
    render?: BasePopover.Trigger.Props['render']
    /** Disables the trigger. */
    disabled?: boolean
  }
>

export type MultiSelectContentWidth = 's' | 'm' | 'l'
export type MultiSelectContentHeight = 's' | 'm' | 'l'

export interface MultiSelectContentProps {
  /** Accessible name for the popup. */
  label: string
  /** Controls the popup width. */
  width?: MultiSelectContentWidth
  /** Controls the scrolling option-list height. */
  maxHeight?: MultiSelectContentHeight
  /** Keeps the popup mounted while closed. */
  keepMounted?: boolean
  /** Aligns the popup along the trigger. */
  align?: BasePopover.Positioner.Props['align']
}

interface MultiSelectContextValue {
  disabled: boolean
  items: readonly MultiSelectItem[]
  triggerRef: RefObject<ComponentRef<typeof BasePopover.Trigger> | null>
}

const MultiSelectContext = createContext<MultiSelectContextValue | null>(null)

function useMultiSelectContext(): MultiSelectContextValue {
  const context = useContext(MultiSelectContext)
  if (context === null) {
    throw new Error('MultiSelect parts must be rendered inside MultiSelect.Root.')
  }
  return context
}

function MultiSelectRoot({
  children,
  items,
  value,
  defaultValue = [],
  onValueChange,
  defaultOpen = false,
  open,
  onOpenChange,
  disabled = false,
}: MultiSelectRootProps): React.ReactElement {
  const triggerRef = useRef<ComponentRef<typeof BasePopover.Trigger>>(null)
  const contextValue = useMemo<MultiSelectContextValue>(
    () => ({
      disabled,
      items,
      triggerRef,
    }),
    [disabled, items],
  )

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <CheckboxGroup.Root
        items={items}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(nextValue) => onValueChange?.(nextValue)}
        disabled={disabled}
      >
        <BasePopover.Root
          defaultOpen={defaultOpen}
          open={open}
          onOpenChange={onOpenChange}
        >
          {children}
        </BasePopover.Root>
      </CheckboxGroup.Root>
    </MultiSelectContext.Provider>
  )
}

const MultiSelectTrigger = forwardRef<
  ComponentRef<typeof BasePopover.Trigger>,
  MultiSelectTriggerProps
>(function MultiSelectTrigger(
  { label, children, render, disabled = false, 'aria-describedby': describedBy, ...props },
  forwardedRef,
): React.ReactElement {
  const context = useMultiSelectContext()
  const summaryId = useId()
  const renderDescription = isValidElement<{ 'aria-describedby'?: string }>(render)
    ? render.props['aria-describedby']
    : undefined
  const descriptionIds = [renderDescription, describedBy, summaryId].filter(Boolean).join(' ')
  const mergedRender = isValidElement<{ 'aria-describedby'?: string }>(render)
    ? cloneElement(render, { 'aria-describedby': descriptionIds })
    : render
  const triggerRef = useCallback(
    (element: ComponentRef<typeof BasePopover.Trigger> | null) => {
      context.triggerRef.current = element
      const cleanup =
        typeof forwardedRef === 'function'
          ? (forwardedRef as RefCallback<ComponentRef<typeof BasePopover.Trigger>>)(element)
          : (() => {
              if (forwardedRef !== null) {
                forwardedRef.current = element
              }
              return undefined
            })()

      return () => {
        context.triggerRef.current = null
        if (typeof cleanup === 'function') {
          cleanup()
        } else if (typeof forwardedRef === 'function') {
          forwardedRef(null)
        } else if (forwardedRef !== null) {
          forwardedRef.current = null
        }
      }
    },
    [context.triggerRef, forwardedRef],
  )
  const triggerStyles = createStateStyleProps<BasePopover.Trigger.State>((state) => [
    state.open === true && multiSelectStyles.triggerOpen,
    state.disabled === true && multiSelectStyles.triggerDisabled,
  ])

  return (
    <BasePopover.Trigger
      {...props}
      aria-label={label}
      aria-describedby={descriptionIds}
      disabled={disabled === true || context.disabled === true}
      ref={triggerRef as BasePopover.Trigger.Props['ref']}
      render={
        mergedRender ?? (
          <Button
            type="button"
            variant="secondary"
            size="m"
          />
        )
      }
      {...triggerStyles}
    >
      <span id={summaryId}>{children}</span>
    </BasePopover.Trigger>
  )
})

const popupWidthStyles = {
  s: multiSelectStyles.popupWidthS,
  m: multiSelectStyles.popupWidthM,
  l: multiSelectStyles.popupWidthL,
} satisfies Record<MultiSelectContentWidth, unknown>

function MultiSelectContent({
  label,
  width = 'm',
  maxHeight = 'm',
  keepMounted = false,
  align = 'start',
}: MultiSelectContentProps): React.ReactElement {
  const context = useMultiSelectContext()
  const focusCheckboxGroupEdge = useCheckboxGroupNavigation()
  const popupRef = useRef<ComponentRef<typeof BasePopover.Popup>>(null)
  const positionerStyles = createStateStyleProps<BasePopover.Positioner.State>((state) => [
    multiSelectStyles.positioner,
    state.open === true && multiSelectStyles.positionerOpen,
    state.open === false && multiSelectStyles.positionerClosed,
    state.anchorHidden === true && multiSelectStyles.positionerAnchorHidden,
    state.instant !== undefined && multiSelectStyles.positionerInstant,
    state.side === 'top' && multiSelectStyles.positionerSideTop,
    state.side === 'bottom' && multiSelectStyles.positionerSideBottom,
    state.side === 'left' && multiSelectStyles.positionerSideLeft,
    state.side === 'right' && multiSelectStyles.positionerSideRight,
    state.side === 'inline-start' && multiSelectStyles.positionerSideInlineStart,
    state.side === 'inline-end' && multiSelectStyles.positionerSideInlineEnd,
    state.align === 'start' && multiSelectStyles.positionerAlignStart,
    state.align === 'center' && multiSelectStyles.positionerAlignCenter,
    state.align === 'end' && multiSelectStyles.positionerAlignEnd,
  ])
  const popupStyles = createStateStyleProps<BasePopover.Popup.State>((state) => [
    multiSelectStyles.popup,
    popupWidthStyles[width],
    state.open === true && multiSelectStyles.popupOpen,
    state.open === false && multiSelectStyles.popupClosed,
    state.transitionStatus === 'starting' && multiSelectStyles.popupStarting,
    state.transitionStatus === 'ending' && multiSelectStyles.popupEnding,
    state.instant !== undefined && multiSelectStyles.popupInstant,
    state.side === 'top' && multiSelectStyles.popupSideTop,
    state.side === 'bottom' && multiSelectStyles.popupSideBottom,
    state.side === 'left' && multiSelectStyles.popupSideLeft,
    state.side === 'right' && multiSelectStyles.popupSideRight,
    state.side === 'inline-start' && multiSelectStyles.popupSideInlineStart,
    state.side === 'inline-end' && multiSelectStyles.popupSideInlineEnd,
    state.align === 'start' && multiSelectStyles.popupAlignStart,
    state.align === 'center' && multiSelectStyles.popupAlignCenter,
    state.align === 'end' && multiSelectStyles.popupAlignEnd,
  ])
  const deferRendering = context.items.length > deferredRenderingThreshold

  return (
    <BasePopover.Portal keepMounted={keepMounted}>
      <BasePopover.Positioner
        align={align}
        sideOffset={popupPositioning.dropdownSideOffset}
        {...positionerStyles}
      >
        <BasePopover.Popup
          ref={popupRef}
          aria-label={label}
          finalFocus={context.triggerRef}
          initialFocus={popupRef}
          role="dialog"
          onKeyDown={(event) => {
            if (event.defaultPrevented === true || event.target !== event.currentTarget) {
              return
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              focusCheckboxGroupEdge(event.key === 'ArrowDown' ? 'first' : 'last')
            }
          }}
          {...popupStyles}
        >
          <ScrollAreaPrivate
            layout="content"
            maxHeight={maxHeight}
            rootSlot="multi-select-scroll-area"
            viewportSlot="multi-select-viewport"
          >
            <CheckboxGroupListPrivate
              label={label}
              rendering={deferRendering === true ? 'deferred' : 'eager'}
              tabbable={false}
            />
          </ScrollAreaPrivate>
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
}

export const MultiSelect = Object.assign(MultiSelectRoot, {
  Root: MultiSelectRoot,
  Trigger: MultiSelectTrigger,
  Content: MultiSelectContent,
})
