import { Toggle as BaseToggle } from '@base-ui/react/toggle'
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group'
import React, { useContext, type ReactElement, type RefAttributes } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { toggleGroupStyles } from './toggleGroup.styles'
import { ToggleGroupContext } from './toggleGroupContext'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style'>

export type ToggleGroupOrientation = 'horizontal' | 'vertical'
export type ToggleGroupWidth = 'content' | 'full'
export type ToggleGroupItemWidth = 'content' | 'equal'
export type ToggleGroupSize = 's' | 'm' | 'l'

export interface ToggleGroupRootProps<Value extends string = string> extends Omit<
  WithoutStyles<BaseToggleGroup.Props<Value>>,
  'ref' | 'render'
> {
  /** The values of the pressed items when controlled. */
  value?: readonly Value[]
  /** The initial values of the pressed items when uncontrolled. */
  defaultValue?: readonly Value[]
  /** Called when the pressed item values change. */
  onValueChange?: BaseToggleGroup.Props<Value>['onValueChange']
  /** Loops keyboard focus from the last item to the first and vice versa. */
  loopFocus?: boolean
  /** Allows more than one item to be pressed. */
  multiple?: boolean
  /** Disables every item in the group. */
  disabled?: boolean
  /** Controls the group layout and arrow-key navigation axis. */
  orientation?: ToggleGroupOrientation
  /** Controls whether the group follows its content or fills its container. */
  width?: ToggleGroupWidth
  /** Controls whether items follow their content or share available width. */
  itemWidth?: ToggleGroupItemWidth
  /** Controls the group height; items inherit the selected size. */
  size?: ToggleGroupSize
}

export interface ToggleGroupItemProps extends Omit<
  WithoutStyles<BaseToggle.Props>,
  'defaultPressed' | 'pressed' | 'ref' | 'value'
> {
  /** Uniquely identifies the item within its group. */
  value: string
  /** Called before the group commits the next pressed state. */
  onPressedChange?: BaseToggle.Props['onPressedChange']
  /** Whether the rendered element is a native button. */
  nativeButton?: boolean
  /** Disables this item. */
  disabled?: boolean
  /** Composes item behavior and styles onto another element. */
  render?: BaseToggle.Props['render']
}

function ToggleGroupRootInner<Value extends string>(
  {
    loopFocus = true,
    multiple = false,
    disabled = false,
    orientation = 'horizontal',
    width = 'content',
    itemWidth = 'content',
    size = 'l',
    ...props
  }: ToggleGroupRootProps<Value>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const sizeStyles = {
    s: toggleGroupStyles.rootSizeS,
    m: toggleGroupStyles.rootSizeM,
    l: toggleGroupStyles.rootSizeL,
  } satisfies Record<ToggleGroupSize, unknown>
  const stateStyles = createStateStyleProps<BaseToggleGroup.State>((state) => [
    toggleGroupStyles.root,
    state.orientation === 'horizontal' ? toggleGroupStyles.horizontal : toggleGroupStyles.vertical,
    state.disabled === true && toggleGroupStyles.rootDisabled,
    state.multiple === true && toggleGroupStyles.rootMultiple,
    width === 'full' && toggleGroupStyles.rootFullWidth,
    state.orientation === 'horizontal' && sizeStyles[size],
  ])

  return (
    <ToggleGroupContext.Provider value={{ equalWidth: itemWidth === 'equal', size }}>
      <BaseToggleGroup
        {...props}
        ref={ref}
        loopFocus={loopFocus}
        multiple={multiple}
        disabled={disabled}
        orientation={orientation}
        {...stateStyles}
        data-size={size}
        data-slot="toggle-group"
      />
    </ToggleGroupContext.Provider>
  )
}

const ToggleGroupRoot = React.forwardRef(ToggleGroupRootInner) as <Value extends string = string>(
  props: ToggleGroupRootProps<Value> & RefAttributes<HTMLDivElement>,
) => ReactElement

const ToggleGroupItem = React.forwardRef<React.ComponentRef<typeof BaseToggle>, ToggleGroupItemProps>(
  function ToggleGroupItem({ nativeButton = true, disabled = false, ...props }, ref) {
    const { equalWidth, size } = useContext(ToggleGroupContext)
    const sizeStyles = {
      s: toggleGroupStyles.itemSizeS,
      m: toggleGroupStyles.itemSizeM,
      l: toggleGroupStyles.itemSizeL,
    } satisfies Record<ToggleGroupSize, unknown>
    const stateStyles = createStateStyleProps<BaseToggle.State>((state) => [
      toggleGroupStyles.item,
      sizeStyles[size],
      equalWidth === true && toggleGroupStyles.itemEqualWidth,
      state.pressed === true && toggleGroupStyles.itemPressed,
      state.disabled === true && toggleGroupStyles.itemDisabled,
      state.pressed === true && state.disabled === true && toggleGroupStyles.itemPressedDisabled,
    ])

    return (
      <BaseToggle
        {...props}
        ref={ref}
        nativeButton={nativeButton}
        disabled={disabled}
        {...stateStyles}
        data-size={size}
        data-slot="toggle-group-item"
      />
    )
  },
)

export const ToggleGroup = Object.assign(ToggleGroupRoot, {
  Root: ToggleGroupRoot,
  Item: ToggleGroupItem,
})
