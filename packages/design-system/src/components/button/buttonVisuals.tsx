import type { ReactNode } from 'react'
import * as stylex from '@stylexjs/stylex'

import { buttonGroupStyles } from '../buttonGroup/buttonGroup.styles'
import type { ButtonGroupOrientation } from '../buttonGroup/buttonGroupContext'
import { Spinner } from '../spinner/spinner'
import { buttonStyles } from './button.styles'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'outline'
  | 'link'

export type ButtonSize = 'xs' | 's' | 'm' | 'l'
export type ButtonShape = 'square'
export type ButtonJustify = 'center' | 'start' | 'between'
export type ButtonRadius = 'none' | 'xs' | 's' | 'm' | 'l' | 'xl'
export type ButtonInset = 'default' | 'flush'

const variantStyles = {
  primary: buttonStyles.primary,
  secondary: buttonStyles.secondary,
  danger: buttonStyles.danger,
  ghost: buttonStyles.ghost,
  outline: buttonStyles.outline,
  link: buttonStyles.link,
} satisfies Record<ButtonVariant, unknown>

const sizeStyles = {
  xs: buttonStyles.sizeXS,
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

const insetStyles = {
  default: undefined,
  flush: buttonStyles.insetFlush,
} satisfies Record<ButtonInset, unknown>

interface ButtonVisualStylesOptions {
  variant: ButtonVariant
  size: ButtonSize
  shape: ButtonShape | undefined
  fullWidth: boolean
  justify: ButtonJustify
  radius: ButtonRadius
  inset: ButtonInset
  orientation: ButtonGroupOrientation | null
  disabled: boolean
}

export function getButtonVisualStyles({
  variant,
  size,
  shape,
  fullWidth,
  justify,
  radius,
  inset,
  orientation,
  disabled,
}: ButtonVisualStylesOptions) {
  return [
    buttonStyles.base,
    variantStyles[variant],
    sizeStyles[size],
    shape === 'square' && buttonStyles.square,
    radiusStyles[radius],
    insetStyles[inset],
    orientation !== null && buttonGroupStyles.member,
    orientation === 'horizontal' && buttonGroupStyles.memberHorizontal,
    orientation === 'vertical' && buttonGroupStyles.memberVertical,
    fullWidth === true && buttonStyles.fullWidth,
    justifyStyles[justify],
    disabled === true && buttonStyles.disabled,
  ]
}

interface ButtonContentProps {
  children: ReactNode
  prefix?: ReactNode
  suffix?: ReactNode
  shape?: ButtonShape
  loading?: boolean
  justify: ButtonJustify
  size: ButtonSize
}

export function ButtonContent({
  children,
  prefix,
  suffix,
  shape,
  loading = false,
  justify,
  size,
}: ButtonContentProps) {
  const spinnerSize = size === 'xs' ? 's' : size
  const prefixContent = loading === true || prefix !== undefined ? (
    <span aria-hidden="true" {...stylex.props(buttonStyles.iconSlot)}>
      {loading === true ? <Spinner size={spinnerSize} /> : prefix}
    </span>
  ) : null

  return (
    <span
      data-slot="button-content"
      {...stylex.props(
        buttonStyles.content,
        justify === 'between' && buttonStyles.contentBetween,
      )}
    >
      {shape === 'square' ? (
        loading === true ? <Spinner size={spinnerSize} /> : children
      ) : justify === 'between' ? (
        <>
          <span data-slot="button-leading" {...stylex.props(buttonStyles.leadingContent)}>
            {prefixContent}
            {children}
          </span>
          {suffix !== undefined ? (
            <span aria-hidden="true" {...stylex.props(buttonStyles.iconSlot)}>
              {suffix}
            </span>
          ) : null}
        </>
      ) : (
        <>
          {prefixContent}
          {children}
          {suffix !== undefined ? (
            <span aria-hidden="true" {...stylex.props(buttonStyles.iconSlot)}>
              {suffix}
            </span>
          ) : null}
        </>
      )}
    </span>
  )
}
