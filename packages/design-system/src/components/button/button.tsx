import { Button as BaseButton } from '@base-ui/react/button'
import { useContext } from 'react'
import type React from 'react'

import { ButtonGroupOrientationContext } from '../buttonGroup/buttonGroupContext'
import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import {
  ButtonContent,
  getButtonOpticalAlignment,
  getButtonVisualStyles,
  type ButtonJustify,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant,
} from './buttonVisuals'

export type {
  ButtonJustify,
  ButtonRadius,
  ButtonSize,
  ButtonVariant,
} from './buttonVisuals'

type BaseButtonProps = Omit<
  BaseButton.Props,
  'className' | 'focusableWhenDisabled' | 'nativeButton' | 'prefix' | 'style'
>

interface ButtonSharedProps {
  /** Controls the visual treatment and emphasis of the action. */
  variant?: ButtonVariant
  /** Controls the button height and horizontal padding. */
  size?: ButtonSize
  /** Shows a leading spinner, preserves the label, and blocks interaction. */
  loading?: boolean
  /** Selects a design-system corner radius. */
  radius?: ButtonRadius
  /** Disables interaction and exposes the disabled state to assistive technology. */
  disabled?: BaseButton.Props['disabled']
  /** Composes Button behavior and styles onto another native button component. */
  render?: BaseButton.Props['render']
}

interface LabelButtonProps {
  /** Makes the button a square icon-only action. */
  iconOnly?: false
  /** Stretches the button to the width of its container. */
  fullWidth?: boolean
  /** Controls how content is distributed inside the button. */
  justify?: ButtonJustify
  /** Renders decorative content before the visible label. */
  prefix?: React.ReactNode
  /** Renders decorative content after the visible label. */
  suffix?: React.ReactNode
}

interface IconOnlyButtonProps {
  /** Makes the button a square icon-only action. */
  iconOnly: true
  /** Identifies the icon-only action for assistive technology. */
  'aria-label': string
  fullWidth?: never
  justify?: never
  prefix?: never
  suffix?: never
}

export type ButtonProps = BaseButtonProps &
  ButtonSharedProps &
  (LabelButtonProps | IconOnlyButtonProps)

export function Button({
  variant = 'primary',
  size = 'm',
  loading = false,
  iconOnly = false,
  fullWidth = false,
  justify = 'center',
  radius = 'xs',
  prefix,
  suffix,
  disabled = false,
  render,
  children,
  'aria-pressed': ariaPressed,
  type = 'button',
  ...props
}: ButtonProps) {
  const buttonGroupOrientation = useContext(ButtonGroupOrientationContext)
  const isDisabled = disabled === true
  const isInteractionBlocked = isDisabled === true || loading === true
  const opticalAlignment = getButtonOpticalAlignment({
    prefix,
    suffix,
    loading,
    justify,
  })
  const stateStyleProps = createStateStyleProps<BaseButton.State>((state) =>
    getButtonVisualStyles({
      variant,
      size,
      square: iconOnly,
      pressed: ariaPressed === true,
      fullWidth,
      justify,
      radius,
      orientation: buttonGroupOrientation,
      disabled: state.disabled,
      opticalAlignment,
    }),
  )

  return (
    <BaseButton
      {...props}
      aria-pressed={ariaPressed}
      disabled={isInteractionBlocked}
      focusableWhenDisabled={loading === true}
      render={render ?? <button type={type} />}
      {...stateStyleProps}
      aria-busy={loading === true ? true : undefined}
      data-full-width={fullWidth === true ? '' : undefined}
      data-icon-only={iconOnly === true ? '' : undefined}
      data-loading={loading === true ? '' : undefined}
      data-optical-alignment={opticalAlignment}
      data-pressed={ariaPressed === true ? '' : undefined}
      data-radius={radius}
      data-size={size}
      data-slot="button"
      data-variant={variant}
    >
      <ButtonContent
        prefix={prefix}
        suffix={suffix}
        loading={loading}
        iconOnly={iconOnly}
        justify={justify}
        size={size}
      >
        {children}
      </ButtonContent>
    </BaseButton>
  )
}
