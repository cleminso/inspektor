import { Button as BaseButton } from '@base-ui/react/button'
import { useContext } from 'react'
import type React from 'react'

import { ButtonGroupOrientationContext } from '../buttonGroup/buttonGroupContext'
import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import {
  ButtonContent,
  getButtonVisualStyles,
  type ButtonInset,
  type ButtonJustify,
  type ButtonRadius,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from './buttonVisuals'

export type {
  ButtonInset,
  ButtonJustify,
  ButtonRadius,
  ButtonShape,
  ButtonSize,
  ButtonVariant,
} from './buttonVisuals'

export interface ButtonProps
  extends Omit<
    BaseButton.Props,
    'className' | 'focusableWhenDisabled' | 'nativeButton' | 'prefix' | 'style'
  > {
  /** Controls the visual treatment and emphasis of the action. */
  variant?: ButtonVariant
  /** Controls the button height and horizontal padding. */
  size?: ButtonSize
  /** Makes an icon-only button square. Pair with an accessible label. */
  shape?: ButtonShape
  /** Shows a leading spinner, preserves the label, and blocks interaction. */
  loading?: boolean
  /** Stretches the button to the width of its container. */
  fullWidth?: boolean
  /** Controls how content is distributed inside the button. */
  justify?: ButtonJustify
  /** Selects a design-system corner radius. */
  radius?: ButtonRadius
  /** Controls the inline inset for actions aligned with compact popup content. */
  inset?: ButtonInset
  /** Renders decorative content before the visible label. */
  prefix?: React.ReactNode
  /** Renders decorative content after the visible label. */
  suffix?: React.ReactNode
  /** Disables interaction and exposes the disabled state to assistive technology. */
  disabled?: BaseButton.Props['disabled']
  /** Composes Button behavior and styles onto another native button component. */
  render?: BaseButton.Props['render']
}

export function Button({
  variant = 'primary',
  size = 'm',
  shape,
  loading = false,
  fullWidth = false,
  justify = 'center',
  radius = 'xs',
  inset = 'default',
  prefix,
  suffix,
  disabled = false,
  render,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const buttonGroupOrientation = useContext(ButtonGroupOrientationContext)
  const isDisabled = disabled === true
  const isInteractionBlocked = isDisabled === true || loading === true
  const stateStyleProps = createStateStyleProps<BaseButton.State>((state) =>
    getButtonVisualStyles({
      variant,
      size,
      shape,
      fullWidth,
      justify,
      radius,
      inset,
      orientation: buttonGroupOrientation,
      disabled: state.disabled,
    }),
  )

  return (
    <BaseButton
      {...props}
      disabled={isInteractionBlocked}
      focusableWhenDisabled={loading === true}
      render={render ?? <button type={type} />}
      {...stateStyleProps}
      aria-busy={loading === true ? true : undefined}
      data-full-width={fullWidth === true ? '' : undefined}
      data-inset={inset}
      data-loading={loading === true ? '' : undefined}
      data-radius={radius}
      data-shape={shape}
      data-size={size}
      data-slot="button"
      data-variant={variant}
    >
      <ButtonContent
        prefix={prefix}
        suffix={suffix}
        shape={shape}
        loading={loading}
        size={size}
      >
        {children}
      </ButtonContent>
    </BaseButton>
  )
}
