import type { ReactNode } from 'react'
import * as stylex from '@stylexjs/stylex'

import { buttonGroupStyles } from '../buttonGroup/buttonGroup.styles'
import type { ButtonGroupOrientation } from '../buttonGroup/buttonGroupContext'
import { Spinner, type SpinnerSize } from '../spinner/spinner'
import { buttonStyles } from './button.styles'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'link'

export type ButtonSize = 'xs' | 's' | 'm'
export type ButtonJustify = 'center' | 'start' | 'between'
export type ButtonRadius = 'none' | 'xs' | 's' | 'm'

const variantStyles = {
  primary: buttonStyles.primary,
  secondary: buttonStyles.secondary,
  danger: buttonStyles.danger,
  ghost: buttonStyles.ghost,
  link: buttonStyles.link,
} satisfies Record<ButtonVariant, unknown>

const sizeStyles = {
  xs: buttonStyles.sizeXS,
  s: buttonStyles.sizeS,
  m: buttonStyles.sizeM,
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
} satisfies Record<ButtonRadius, unknown>

const spinnerSizes = {
  xs: 's',
  s: 'm',
  m: 'l',
} satisfies Record<ButtonSize, SpinnerSize>

interface ButtonVisualStylesOptions {
  variant: ButtonVariant
  size: ButtonSize
  square: boolean
  pressed: boolean
  fullWidth: boolean
  justify: ButtonJustify
  radius: ButtonRadius
  orientation: ButtonGroupOrientation | null
  disabled: boolean
  hasPrefix: boolean
  hasSuffix: boolean
}

export function getButtonVisualStyles({
  variant,
  size,
  square,
  pressed,
  fullWidth,
  justify,
  radius,
  orientation,
  disabled,
  hasPrefix,
  hasSuffix,
}: ButtonVisualStylesOptions) {
  return [
    buttonStyles.base,
    sizeStyles[size],
    hasPrefix === true && buttonStyles.withPrefix,
    hasSuffix === true && buttonStyles.withSuffix,
    variantStyles[variant],
    square === true && buttonStyles.square,
    pressed === true && buttonStyles.pressed,
    radiusStyles[radius],
    orientation !== null && buttonGroupStyles.member,
    orientation === 'horizontal' && buttonGroupStyles.memberHorizontal,
    orientation === 'vertical' && buttonGroupStyles.memberVertical,
    fullWidth === true && buttonStyles.fullWidth,
    justifyStyles[justify],
    disabled === true &&
      (variant === 'ghost' || variant === 'link'
        ? buttonStyles.disabledBare
        : buttonStyles.disabled),
  ]
}

interface ButtonContentProps {
  children: ReactNode
  iconOnly?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
  loading?: boolean
  justify: ButtonJustify
  size: ButtonSize
}

export function ButtonContent({
  children,
  iconOnly = false,
  prefix,
  suffix,
  loading = false,
  justify,
  size,
}: ButtonContentProps) {
  const spinnerSize = spinnerSizes[size]

  if (iconOnly === true) {
    return (
      <span aria-hidden="true" data-slot="button-icon" {...stylex.props(buttonStyles.iconSlot)}>
        {loading === true ? <Spinner size={spinnerSize} /> : children}
      </span>
    )
  }

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
      {justify === 'between' ? (
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
