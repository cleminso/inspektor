import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import { useContext } from 'react'
import type React from 'react'

import { buttonGroupStyles } from '../buttonGroup/buttonGroup.styles'
import { ButtonGroupOrientationContext } from '../buttonGroup/buttonGroupContext'
import { Spinner } from '../spinner/spinner'
import { buttonStyles } from './button.styles'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'outline'
  | 'link'

export type ButtonSize = 's' | 'm' | 'l'
export type ButtonShape = 'square'
export type ButtonJustify = 'center' | 'start' | 'between'
export type ButtonRadius = 'none' | 'xs' | 's' | 'm' | 'l' | 'xl'

const variantStyles = {
  primary: buttonStyles.primary,
  secondary: buttonStyles.secondary,
  danger: buttonStyles.danger,
  ghost: buttonStyles.ghost,
  outline: buttonStyles.outline,
  link: buttonStyles.link,
} satisfies Record<ButtonVariant, unknown>

const sizeStyles = {
  s: buttonStyles.sizeS,
  m: buttonStyles.sizeM,
  l: buttonStyles.sizeL,
} satisfies Record<ButtonSize, unknown>

const justifyStyles = {
  center: buttonStyles.justifyCenter,
  start: buttonStyles.justifyStart,
  between: buttonStyles.justifyBetween,
} satisfies Record<ButtonJustify, unknown>

const radiusStyles = {
  none: buttonStyles.radiusNone,
  xs: buttonStyles.radiusXS,
  s: buttonStyles.radiusS,
  m: buttonStyles.radiusM,
  l: buttonStyles.radiusL,
  xl: buttonStyles.radiusXL,
} satisfies Record<ButtonRadius, unknown>

export interface ButtonProps
  extends Omit<
    useRender.ComponentProps<'button'>,
    'className' | 'prefix' | 'style'
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
  /** Renders decorative content before the visible label. */
  prefix?: React.ReactNode
  /** Renders decorative content after the visible label. */
  suffix?: React.ReactNode
  /** Disables interaction and exposes the disabled state to assistive technology. */
  disabled?: useRender.ComponentProps<'button'>['disabled']
  /** Composes Button behavior and styles onto another element, such as a link. */
  render?: useRender.ComponentProps<'button'>['render']
}

export function Button({
  variant = 'primary',
  size = 'm',
  shape,
  loading = false,
  fullWidth = false,
  justify = 'center',
  radius = 'xs',
  prefix,
  suffix,
  disabled = false,
  render,
  children,
  type = 'button',
  onClick,
  ...props
}: ButtonProps) {
  const buttonGroupOrientation = useContext(ButtonGroupOrientationContext)
  const isDisabled = disabled === true
  const isInteractionBlocked = isDisabled === true || loading === true
  const rootStylexProps = stylex.props(
    buttonStyles.base,
    variantStyles[variant],
    sizeStyles[size],
    shape === 'square' && buttonStyles.square,
    radiusStyles[radius],
    buttonGroupOrientation !== null && buttonGroupStyles.member,
    buttonGroupOrientation === 'horizontal' && buttonGroupStyles.memberHorizontal,
    buttonGroupOrientation === 'vertical' && buttonGroupStyles.memberVertical,
    fullWidth === true && buttonStyles.fullWidth,
    justifyStyles[justify],
    isInteractionBlocked === true && buttonStyles.disabled,
  )
  const contentStylexProps = stylex.props(buttonStyles.content)
  const iconSlotStylexProps = stylex.props(buttonStyles.iconSlot)

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (isInteractionBlocked === true) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    onClick?.(event)
  }

  const defaultProps = {
    className: rootStylexProps.className,
    style: rootStylexProps.style,
    disabled: isDisabled,
    'aria-busy': loading === true ? true : undefined,
    'aria-disabled': isInteractionBlocked === true ? true : undefined,
    'data-slot': 'button',
    'data-size': size,
    'data-radius': radius,
    'data-shape': shape,
    'data-variant': variant,
    'data-loading': loading === true ? '' : undefined,
    'data-full-width': fullWidth === true ? '' : undefined,
    onClick: handleClick,
    children: (
      <span
        className={contentStylexProps.className}
        style={contentStylexProps.style}
      >
        {shape === 'square' ? (
          loading === true ? <Spinner size={size} /> : children
        ) : (
          <>
            {loading === true || prefix !== undefined ? (
              <span
                aria-hidden="true"
                className={iconSlotStylexProps.className}
                style={iconSlotStylexProps.style}
              >
                {loading === true ? <Spinner size={size} /> : prefix}
              </span>
            ) : null}
            {children}
            {suffix !== undefined ? (
              <span
                aria-hidden="true"
                className={iconSlotStylexProps.className}
                style={iconSlotStylexProps.style}
              >
                {suffix}
              </span>
            ) : null}
          </>
        )}
      </span>
    ),
  } as useRender.ComponentProps<'button'>

  return useRender({
    render: render ?? <button type={type} />,
    props: mergeProps<'button'>(defaultProps, props),
  })
}
