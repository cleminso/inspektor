import { Button as BaseButton } from '@base-ui/react/button'
import { forwardRef, useContext } from 'react'
import type React from 'react'

import { ButtonGroupOrientationContext } from '../buttonGroup/buttonGroupContext'
import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import {
  ButtonContent,
  buttonLayoutOptions,
  getButtonVisualStyles,
  type ButtonLayout,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant,
} from './buttonVisuals'

export type { ButtonLayout, ButtonRadius, ButtonSize, ButtonVariant } from './buttonVisuals'

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
  /** Selects inline or full-width row action layout. */
  layout?: ButtonLayout
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
  layout?: never
  prefix?: never
  suffix?: never
}

export type ButtonProps = BaseButtonProps &
  ButtonSharedProps &
  (LabelButtonProps | IconOnlyButtonProps)

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'm',
    loading = false,
    iconOnly = false,
    layout = 'inline',
    radius = 'xs',
    prefix,
    suffix,
    disabled = false,
    render,
    children,
    'aria-pressed': ariaPressed,
    type = 'button',
    ...props
  },
  forwardedRef,
) {
  const buttonGroupOrientation = useContext(ButtonGroupOrientationContext)
  const layoutOptions = buttonLayoutOptions[layout]
  const isDisabled = disabled === true
  const isInteractionBlocked = isDisabled === true || loading === true
  const stateStyleProps = createStateStyleProps<BaseButton.State>((state) =>
    getButtonVisualStyles({
      variant,
      size,
      square: iconOnly,
      pressed: ariaPressed === true,
      radius,
      fill: layoutOptions.fill,
      alignment: layoutOptions.alignment,
      orientation: buttonGroupOrientation,
      disabled: state.disabled,
      hasPrefix: loading === true || prefix !== undefined,
      hasSuffix: suffix !== undefined,
    }),
  )

  return (
    <BaseButton
      {...props}
      ref={forwardedRef}
      aria-pressed={ariaPressed}
      disabled={isInteractionBlocked}
      focusableWhenDisabled={loading === true}
      render={render}
      type={type}
      {...stateStyleProps}
      aria-busy={loading === true ? true : undefined}
      data-full-width={layoutOptions.fill === true ? '' : undefined}
      data-icon-only={iconOnly === true ? '' : undefined}
      data-loading={loading === true ? '' : undefined}
      data-pressed={ariaPressed === true ? '' : undefined}
      data-layout={layout}
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
        size={size}
      >
        {children}
      </ButtonContent>
    </BaseButton>
  )
})
