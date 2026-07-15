import { Toggle as BaseToggle } from '@base-ui/react/toggle'
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { toggleGroupStyles } from './toggleGroup.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style'>

export type ToggleGroupOrientation = 'horizontal' | 'vertical'

export interface ToggleGroupRootProps<Value extends string = string>
  extends WithoutStyles<BaseToggleGroup.Props<Value>> {
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
  /** Composes ToggleGroup behavior and styles onto another element. */
  render?: BaseToggleGroup.Props<Value>['render']
}

export interface ToggleGroupItemProps
  extends Omit<WithoutStyles<BaseToggle.Props>, 'defaultPressed' | 'pressed' | 'value'> {
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

function ToggleGroupRoot<Value extends string>({
  loopFocus = true,
  multiple = false,
  disabled = false,
  orientation = 'horizontal',
  ...props
}: ToggleGroupRootProps<Value>) {
  const stateStyles = createStateStyleProps<BaseToggleGroup.State>((state) => [
    toggleGroupStyles.root,
    state.orientation === 'horizontal'
      ? toggleGroupStyles.horizontal
      : toggleGroupStyles.vertical,
    state.disabled === true && toggleGroupStyles.rootDisabled,
  ])

  return (
    <BaseToggleGroup
      {...props}
      loopFocus={loopFocus}
      multiple={multiple}
      disabled={disabled}
      orientation={orientation}
      {...stateStyles}
      data-slot="toggle-group"
    />
  )
}

function ToggleGroupItem({
  nativeButton = true,
  disabled = false,
  ...props
}: ToggleGroupItemProps) {
  const stateStyles = createStateStyleProps<BaseToggle.State>((state) => [
    toggleGroupStyles.item,
    state.pressed === true && toggleGroupStyles.itemPressed,
    state.disabled === true && toggleGroupStyles.itemDisabled,
  ])

  return (
    <BaseToggle
      {...props}
      nativeButton={nativeButton}
      disabled={disabled}
      {...stateStyles}
      data-slot="toggle-group-item"
    />
  )
}

export const ToggleGroup = Object.assign(ToggleGroupRoot, {
  Root: ToggleGroupRoot,
  Item: ToggleGroupItem,
})
