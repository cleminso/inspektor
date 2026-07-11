import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import type React from 'react'

import { buttonStyles } from './button.styles'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'outline'
  | 'link'

export type ButtonSize = 's' | 'm' | 'l' | 'icon-s' | 'icon-m' | 'icon-l'
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
  'icon-s': buttonStyles.iconS,
  'icon-m': buttonStyles.iconM,
  'icon-l': buttonStyles.iconL,
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
  extends Omit<useRender.ComponentProps<'button'>, 'className' | 'style'> {
  /** Controls the visual treatment and emphasis of the action. */
  variant?: ButtonVariant
  /** Controls the button height and horizontal padding. Icon sizes are square. */
  size?: ButtonSize
  /** Shows a centered loading indicator, preserves the label width, and disables interaction. */
  loading?: boolean
  /** Stretches the button to the width of its container. */
  fullWidth?: boolean
  /** Controls how content is distributed inside the button. */
  justify?: ButtonJustify
  /** Selects a design-system corner radius. */
  radius?: ButtonRadius
  /** Disables interaction and exposes the disabled state to assistive technology. */
  disabled?: useRender.ComponentProps<'button'>['disabled']
  /** Composes Button behavior and styles onto another element, such as a link. */
  render?: useRender.ComponentProps<'button'>['render']
}

export function Button({
  variant = 'primary',
  size = 'm',
  loading = false,
  fullWidth = false,
  justify = 'center',
  radius = 'xs',
  disabled = false,
  render,
  children,
  type = 'button',
  onClick,
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || loading === true
  const rootStylexProps = stylex.props(
    buttonStyles.base,
    variantStyles[variant],
    sizeStyles[size],
    radiusStyles[radius],
    fullWidth === true && buttonStyles.fullWidth,
    justifyStyles[justify],
    isDisabled === true && buttonStyles.disabled,
  )
  const contentStylexProps = stylex.props(
    buttonStyles.content,
    loading === true && buttonStyles.loadingContent,
  )
  const loadingIndicatorStylexProps = stylex.props(buttonStyles.loadingIndicator)
  const loadingDotStylexProps = stylex.props(buttonStyles.loadingDot)

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (isDisabled === true) {
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
    'aria-disabled': isDisabled === true ? true : undefined,
    'data-slot': 'button',
    'data-size': size,
    'data-radius': radius,
    'data-variant': variant,
    'data-loading': loading === true ? '' : undefined,
    'data-full-width': fullWidth === true ? '' : undefined,
    onClick: handleClick,
    children: (
      <>
        {loading === true ? (
          <span
            aria-hidden="true"
            className={loadingIndicatorStylexProps.className}
            style={loadingIndicatorStylexProps.style}
          >
            <span
              className={loadingDotStylexProps.className}
              style={loadingDotStylexProps.style}
            />
          </span>
        ) : null}
        <span
          className={contentStylexProps.className}
          style={contentStylexProps.style}
        >
          {children}
        </span>
      </>
    ),
  } as useRender.ComponentProps<'button'>

  return useRender({
    render: render ?? <button type={type} />,
    props: mergeProps<'button'>(defaultProps, props),
  })
}
