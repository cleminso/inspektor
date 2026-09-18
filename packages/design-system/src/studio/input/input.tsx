import { Input as BaseInput } from '@base-ui/react/input'

import { forwardRef, useContext, type ComponentRef } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { editableControlStyles } from '../../primitives/editableControl.styles'
import type { FormControlSize } from '../../utils/formControlSize'
import { InputGroupContext } from '../inputGroup/inputGroupContext'
import { inputStyles } from './input.styles'

export type InputSize = FormControlSize
export type InputVariant = 'default' | 'subtle'
export type InputFont = 'sans' | 'mono'

const sizeStyles = {
  xs: inputStyles.sizeXS,
  s: inputStyles.sizeS,
  m: inputStyles.sizeM,
  l: inputStyles.sizeL,
} satisfies Record<InputSize, unknown>

const variantStyles = {
  default: undefined,
  subtle: inputStyles.subtle,
} satisfies Record<InputVariant, unknown>

const fontStyles = {
  sans: inputStyles.fontSans,
  mono: inputStyles.fontMono,
} satisfies Record<InputFont, unknown>

export interface InputProps extends Omit<BaseInput.Props, 'className' | 'style' | 'size'> {
  /** Controls the input height. */
  size?: InputSize
  /** Controls the input's visual prominence. */
  variant?: InputVariant
  /** Selects proportional or data-oriented typography. */
  font?: InputFont
  /** Stretches the input to the width of its container. */
  fullWidth?: boolean
  /** Marks the input as invalid and exposes that state to assistive technology. */
  invalid?: boolean
  /** Disables editing and exposes the disabled state to assistive technology. */
  disabled?: BaseInput.Props['disabled']
  /** Prevents editing while preserving focus and text selection. */
  readOnly?: BaseInput.Props['readOnly']
  /** Sets the initial value when the input is uncontrolled. */
  defaultValue?: BaseInput.Props['defaultValue']
  /** Sets the current value when the input is controlled. */
  value?: BaseInput.Props['value']
  /** Runs when the input value changes. */
  onValueChange?: BaseInput.Props['onValueChange']
  /** Composes Input behavior and styles onto another input element. */
  render?: BaseInput.Props['render']
}

export const Input = forwardRef<ComponentRef<typeof BaseInput>, InputProps>(function Input(
  {
    size = 'l',
    variant = 'default',
    font = 'sans',
    fullWidth = false,
    invalid = false,
    disabled = false,
    readOnly = false,
    ...props
  },
  ref,
) {
  const inputGroup = useContext(InputGroupContext)
  const effectiveDisabled = disabled === true || inputGroup?.disabled === true
  const effectiveInvalid = invalid === true || inputGroup?.invalid === true
  const effectiveSize = inputGroup?.size ?? size
  const stateStyleProps = createStateStyleProps<BaseInput.State>((state) => [
    inputStyles.base,
    editableControlStyles.focusVisible,
    readOnly === true && inputStyles.readOnly,
    variantStyles[variant],
    sizeStyles[effectiveSize],
    fontStyles[font],
    fullWidth === true && inputStyles.fullWidth,
    inputGroup !== null && editableControlStyles.groupedMember,
    state.disabled === true && inputStyles.disabled,
    (effectiveInvalid === true || state.valid === false) && inputStyles.invalid,
    state.valid === true && inputStyles.valid,
    state.touched === true && inputStyles.touched,
    state.dirty === true && inputStyles.dirty,
    state.filled === true && inputStyles.filled,
    state.focused === true && inputStyles.focused,
  ])

  return (
    <BaseInput
      {...props}
      ref={ref}
      disabled={effectiveDisabled}
      readOnly={readOnly}
      aria-invalid={effectiveInvalid === true ? true : props['aria-invalid']}
      className={stateStyleProps.className}
      style={stateStyleProps.style}
      {...(effectiveInvalid === true ? { 'data-invalid': '' } : {})}
      data-slot="input"
      data-size={effectiveSize}
      data-variant={variant}
      data-font={font}
      data-full-width={fullWidth === true ? '' : undefined}
      data-grouped={inputGroup !== null ? '' : undefined}
    />
  )
})
