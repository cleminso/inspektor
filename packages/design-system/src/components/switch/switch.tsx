import { Switch as BaseSwitch } from '@base-ui/react/switch'
import { forwardRef } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { switchStyles } from './switch.styles'

export type SwitchSize = 's' | 'm'

export interface SwitchProps extends Omit<
  BaseSwitch.Root.Props,
  'children' | 'className' | 'style'
> {
  /** Controls the switch dimensions. */
  size?: SwitchSize
  /** Controls whether the switch is checked. */
  checked?: BaseSwitch.Root.Props['checked']
  /** Sets the initial checked state when uncontrolled. */
  defaultChecked?: BaseSwitch.Root.Props['defaultChecked']
  /** Runs when the checked state changes. */
  onCheckedChange?: BaseSwitch.Root.Props['onCheckedChange']
  /** Identifies the switch during form submission. */
  name?: BaseSwitch.Root.Props['name']
  /** Sets the submitted value when checked. */
  value?: BaseSwitch.Root.Props['value']
  /** Identifies the form that owns the hidden input. */
  form?: BaseSwitch.Root.Props['form']
  /** Sets the submitted value when unchecked. */
  uncheckedValue?: BaseSwitch.Root.Props['uncheckedValue']
  /** Disables interaction. */
  disabled?: BaseSwitch.Root.Props['disabled']
  /** Prevents changes while preserving interaction semantics. */
  readOnly?: BaseSwitch.Root.Props['readOnly']
  /** Requires the switch to be checked for valid form submission. */
  required?: BaseSwitch.Root.Props['required']
  /** Indicates that a composed root renders a native button. */
  nativeButton?: BaseSwitch.Root.Props['nativeButton']
  /** Provides access to the hidden native input. */
  inputRef?: BaseSwitch.Root.Props['inputRef']
  /** Composes Switch behavior and styles onto another element. */
  render?: BaseSwitch.Root.Props['render']
}

export const Switch = forwardRef<HTMLElement, SwitchProps>(function Switch(
  {
    size = 'm',
    disabled = false,
    readOnly = false,
    required = false,
    nativeButton = false,
    ...props
  },
  ref,
) {
  const rootStyleProps = createStateStyleProps<BaseSwitch.Root.State>((state) => [
    switchStyles.root,
    size === 's' ? switchStyles.rootSizeS : switchStyles.rootSizeM,
    state.checked === true && state.readOnly === false && switchStyles.rootChecked,
    state.checked === true && state.readOnly === true && switchStyles.rootCheckedReadOnly,
    state.valid === false && switchStyles.rootInvalid,
    state.disabled === true && switchStyles.rootDisabled,
    state.checked === false && switchStyles.rootUnchecked,
    state.readOnly === true && switchStyles.rootReadOnly,
    state.readOnly === true && state.checked === false && switchStyles.rootUncheckedReadOnly,
    state.required === true && switchStyles.rootRequired,
    state.valid === true && switchStyles.rootValid,
    state.touched === true && switchStyles.rootTouched,
    state.dirty === true && switchStyles.rootDirty,
    state.filled === true && switchStyles.rootFilled,
    state.focused === true && switchStyles.rootFocused,
  ])
  const thumbStyleProps = createStateStyleProps<BaseSwitch.Thumb.State>((state) => [
    switchStyles.thumb,
    size === 's' ? switchStyles.thumbSizeS : switchStyles.thumbSizeM,
    state.checked === true && switchStyles.thumbChecked,
    state.checked === false && switchStyles.thumbUnchecked,
    state.disabled === true && switchStyles.thumbDisabled,
    state.readOnly === true && switchStyles.thumbReadOnly,
    state.required === true && switchStyles.thumbRequired,
    state.valid === true && switchStyles.thumbValid,
    state.valid === false && switchStyles.thumbInvalid,
    state.touched === true && switchStyles.thumbTouched,
    state.dirty === true && switchStyles.thumbDirty,
    state.filled === true && switchStyles.thumbFilled,
    state.focused === true && switchStyles.thumbFocused,
    state.checked === true &&
      (size === 's' ? switchStyles.thumbSizeSChecked : switchStyles.thumbSizeMChecked),
  ])

  return (
    <BaseSwitch.Root
      {...props}
      ref={ref}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      nativeButton={nativeButton}
      {...rootStyleProps}
      data-slot="switch"
      data-size={size}
    >
      <BaseSwitch.Thumb {...thumbStyleProps} data-slot="switch-thumb" />
    </BaseSwitch.Root>
  )
})
