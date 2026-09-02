import * as stylex from '@stylexjs/stylex'
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ForwardedRef,
  type KeyboardEvent,
  type PropsWithChildren,
} from 'react'

import { Checkbox } from '../checkbox/checkbox'
import { checkboxGroupStyles } from './checkboxGroup.styles'

export interface CheckboxGroupItem {
  /** Unique stable value represented by the option. */
  value: string
  /** Visible option label. */
  label: string
  /** Prevents the option from changing while keeping it visible. */
  disabled?: boolean
}

export type CheckboxGroupRootProps = PropsWithChildren<{
  /** Known options displayed by the checkbox group. */
  items: readonly CheckboxGroupItem[]
  /** Controlled selected values. */
  value?: readonly string[]
  /** Initially selected values when uncontrolled. */
  defaultValue?: readonly string[]
  /** Runs when the selected values change. */
  onValueChange?: (value: string[]) => void
  /** Disables every mutable option. */
  disabled?: boolean
}>

export type CheckboxGroupRendering = 'eager' | 'deferred'

export interface CheckboxGroupListProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'aria-label' | 'children' | 'className' | 'role' | 'style' | 'tabIndex'
> {
  /** Accessible name for the checkbox group. */
  label: string
  /** Defers offscreen row layout and paint while retaining the complete collection. */
  rendering?: CheckboxGroupRendering
}

interface CheckboxGroupListPrivateProps extends CheckboxGroupListProps {
  tabbable?: boolean
}

interface ItemControls {
  action: HTMLButtonElement | null
  checkbox: HTMLElement | null
}

interface CheckboxGroupContextValue {
  controls: Map<string, ItemControls>
  disabled: boolean
  items: readonly CheckboxGroupItem[]
  selectedValues: readonly string[]
  setSelectedValues: (values: string[]) => void
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null)

function useCheckboxGroupContext(): CheckboxGroupContextValue {
  const context = useContext(CheckboxGroupContext)
  if (context === null) {
    throw new Error('CheckboxGroup parts must be rendered inside CheckboxGroup.Root.')
  }
  return context
}

function getMutableItems(context: CheckboxGroupContextValue): readonly CheckboxGroupItem[] {
  return context.disabled === true ? [] : context.items.filter((item) => item.disabled !== true)
}

export function useCheckboxGroupNavigation(): (edge: 'first' | 'last') => void {
  const context = useCheckboxGroupContext()

  return useCallback(
    (edge) => {
      const items = getMutableItems(context)
      const item = edge === 'first' ? items[0] : items.at(-1)
      if (item !== undefined) {
        context.controls.get(item.value)?.action?.focus()
      }
    },
    [context],
  )
}

function CheckboxGroupRoot({
  children,
  items,
  value,
  defaultValue = [],
  onValueChange,
  disabled = false,
}: CheckboxGroupRootProps): React.ReactElement {
  const [uncontrolledValue, setUncontrolledValue] = useState<readonly string[]>(defaultValue)
  const controlsRef = useRef(new Map<string, ItemControls>())
  const selectedValues = value ?? uncontrolledValue
  const setSelectedValues = useCallback(
    (nextValue: string[]) => {
      if (value === undefined) {
        setUncontrolledValue(nextValue)
      }
      onValueChange?.(nextValue)
    },
    [onValueChange, value],
  )
  const contextValue = useMemo<CheckboxGroupContextValue>(
    () => ({
      controls: controlsRef.current,
      disabled,
      items,
      selectedValues,
      setSelectedValues,
    }),
    [disabled, items, selectedValues, setSelectedValues],
  )

  return (
    <CheckboxGroupContext.Provider value={contextValue}>{children}</CheckboxGroupContext.Provider>
  )
}

const CheckboxGroupListPrivate = forwardRef<HTMLDivElement, CheckboxGroupListPrivateProps>(
  function CheckboxGroupListPrivate(
    { label, rendering = 'eager', tabbable = true, ...props }: CheckboxGroupListPrivateProps,
    forwardedRef: ForwardedRef<HTMLDivElement>,
  ): React.ReactElement {
    const context = useCheckboxGroupContext()
    const selectedSet = useMemo(() => new Set(context.selectedValues), [context.selectedValues])
    const mutableItems = useMemo(() => getMutableItems(context), [context])
    const mutableItemIndices = useMemo(
      () => new Map(mutableItems.map((item, index) => [item.value, index])),
      [mutableItems],
    )
    const allMutableSelected = mutableItems.every((item) => selectedSet.has(item.value))

    return (
      <div
        {...props}
        {...stylex.props(checkboxGroupStyles.list)}
        ref={forwardedRef}
        aria-label={label}
        role="group"
      >
        {context.items.map((item) => (
          <CheckboxGroupOption
            key={item.value}
            allMutableSelected={allMutableSelected}
            item={item}
            itemIndex={mutableItemIndices.get(item.value) ?? -1}
            mutableItems={mutableItems}
            rendering={rendering}
            selectedSet={selectedSet}
            tabbable={tabbable}
          />
        ))}
      </div>
    )
  },
)

const CheckboxGroupList = forwardRef<HTMLDivElement, CheckboxGroupListProps>(
  function CheckboxGroupList({ rendering = 'eager', ...props }, forwardedRef): React.ReactElement {
    return (
      <CheckboxGroupListPrivate
        {...props}
        ref={forwardedRef}
        rendering={rendering}
      />
    )
  },
)

export { CheckboxGroupListPrivate }

function CheckboxGroupOption({
  allMutableSelected,
  item,
  itemIndex,
  mutableItems,
  rendering,
  selectedSet,
  tabbable,
}: {
  allMutableSelected: boolean
  item: CheckboxGroupItem
  itemIndex: number
  mutableItems: readonly CheckboxGroupItem[]
  rendering: CheckboxGroupRendering
  selectedSet: ReadonlySet<string>
  tabbable: boolean
}): React.ReactElement {
  const context = useCheckboxGroupContext()
  const checked = selectedSet.has(item.value)
  const disabled = context.disabled === true || item.disabled === true
  const actionKind = allMutableSelected === true || checked === false ? 'only' : 'all'
  const actionLabel = actionKind === 'all' ? `Check all from ${item.label}` : `Only ${item.label}`
  const setActionRef = useCallback(
    (element: HTMLButtonElement | null) => {
      const controls = context.controls.get(item.value) ?? { action: null, checkbox: null }
      controls.action = element
      context.controls.set(item.value, controls)
    },
    [context.controls, item.value],
  )
  const setCheckboxRef = useCallback(
    (element: HTMLElement | null) => {
      const controls = context.controls.get(item.value) ?? { action: null, checkbox: null }
      controls.checkbox = element
      context.controls.set(item.value, controls)
    },
    [context.controls, item.value],
  )

  const setItemChecked = (nextChecked: boolean) => {
    const nextSelected = new Set(context.selectedValues)
    if (nextChecked === true) {
      nextSelected.add(item.value)
    } else {
      nextSelected.delete(item.value)
    }
    context.setSelectedValues(
      context.items
        .filter((candidate) => nextSelected.has(candidate.value))
        .map((candidate) => candidate.value),
    )
  }

  const handleNavigation = (event: KeyboardEvent<HTMLElement>, control: keyof ItemControls) => {
    if (mutableItems.length === 0 || itemIndex < 0) {
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const offset = event.key === 'ArrowDown' ? 1 : -1
      const nextItem =
        mutableItems[(itemIndex + offset + mutableItems.length) % mutableItems.length]
      if (nextItem !== undefined) {
        context.controls.get(nextItem.value)?.[control]?.focus()
      }
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const nextItem = event.key === 'Home' ? mutableItems[0] : mutableItems.at(-1)
      if (nextItem !== undefined) {
        context.controls.get(nextItem.value)?.[control]?.focus()
      }
    }
  }

  return (
    <div
      {...stylex.props(
        checkboxGroupStyles.row,
        rendering === 'deferred' && checkboxGroupStyles.rowDeferred,
        disabled === true && checkboxGroupStyles.rowDisabled,
      )}
      data-slot="checkbox-group-row"
      data-rendering={rendering === 'deferred' ? 'deferred' : undefined}
    >
      <Checkbox
        ref={setCheckboxRef}
        aria-label={`Select ${item.label}`}
        checked={checked}
        disabled={disabled}
        size="s"
        tabIndex={tabbable === true && disabled === false ? 0 : -1}
        onCheckedChange={(nextChecked) => setItemChecked(nextChecked === true)}
        onKeyDown={(event) => {
          handleNavigation(event, 'checkbox')
          if (event.defaultPrevented === true) {
            return
          }
          if (event.key === 'ArrowRight' && disabled === false) {
            event.preventDefault()
            context.controls.get(item.value)?.action?.focus()
          } else if (event.key === 'Enter' && disabled === false) {
            event.preventDefault()
            setItemChecked(checked === false)
          }
        }}
      />
      {disabled === true ? (
        <span
          {...stylex.props(
            checkboxGroupStyles.optionButton,
            checkboxGroupStyles.optionButtonDisabled,
          )}
        >
          <span {...stylex.props(checkboxGroupStyles.optionText)}>{item.label}</span>
        </span>
      ) : (
        <button
          ref={setActionRef}
          {...stylex.props(checkboxGroupStyles.optionButton)}
          data-slot="checkbox-group-action"
          type="button"
          aria-label={actionLabel}
          tabIndex={tabbable === true ? undefined : -1}
          onClick={() => {
            if (actionKind === 'all') {
              const mutableValues = new Set(
                getMutableItems(context).map((candidate) => candidate.value),
              )
              context.setSelectedValues(
                context.items
                  .filter(
                    (candidate) =>
                      mutableValues.has(candidate.value) || selectedSet.has(candidate.value),
                  )
                  .map((candidate) => candidate.value),
              )
              return
            }
            context.setSelectedValues(
              context.items
                .filter(
                  (candidate) =>
                    candidate.value === item.value ||
                    (candidate.disabled === true && selectedSet.has(candidate.value)),
                )
                .map((candidate) => candidate.value),
            )
          }}
          onKeyDown={(event) => {
            handleNavigation(event, 'action')
            if (event.defaultPrevented === false && event.key === 'ArrowLeft') {
              event.preventDefault()
              context.controls.get(item.value)?.checkbox?.focus()
            }
          }}
        >
          <span {...stylex.props(checkboxGroupStyles.optionText)}>{item.label}</span>
          <span
            aria-hidden="true"
            {...stylex.props(checkboxGroupStyles.action)}
          >
            {actionKind === 'all' ? 'Check all' : 'Only'}
          </span>
        </button>
      )}
    </div>
  )
}

export const CheckboxGroup = Object.assign(CheckboxGroupRoot, {
  Root: CheckboxGroupRoot,
  List: CheckboxGroupList,
})
