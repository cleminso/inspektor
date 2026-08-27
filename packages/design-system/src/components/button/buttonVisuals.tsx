import { createContext, useContext, type ReactNode } from 'react'
import * as stylex from '@stylexjs/stylex'

import { buttonGroupStyles } from '../buttonGroup/buttonGroup.styles'
import type { ButtonGroupOrientation } from '../buttonGroup/buttonGroupContext'
import { Icon, type IconArtwork, type IconSize } from '../icon/icon'
import { Spinner, type SpinnerSize } from '../spinner/spinner'
import { buttonStyles } from './button.styles'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'

export type ButtonSize = 'xs' | 's' | 'm'
export type ButtonLayout = 'inline' | 'row' | 'fill' | 'stacked'
export type ButtonRadius = 'none' | 'xs' | 's' | 'm'
export type ButtonGlyphSize = 'standard' | 'compact'

interface ButtonLayoutOptions {
  alignment: 'center' | 'start'
  fill: boolean
}

const variantStyles = {
  primary: buttonStyles.primary,
  secondary: buttonStyles.secondary,
  danger: buttonStyles.danger,
  ghost: buttonStyles.ghost,
  link: buttonStyles.link,
} satisfies Record<ButtonVariant, unknown>

const expandedStyles = {
  primary: buttonStyles.expandedPrimary,
  secondary: buttonStyles.expandedSecondary,
  danger: buttonStyles.expandedDanger,
  ghost: buttonStyles.expandedGhost,
  link: buttonStyles.expandedLink,
} satisfies Record<ButtonVariant, unknown>

const sizeStyles = {
  xs: buttonStyles.sizeXS,
  s: buttonStyles.sizeS,
  m: buttonStyles.sizeM,
} satisfies Record<ButtonSize, unknown>

export const buttonLayoutOptions = {
  inline: { alignment: 'center', fill: false },
  row: { alignment: 'start', fill: true },
  fill: { alignment: 'center', fill: true },
  stacked: { alignment: 'start', fill: true },
} satisfies Record<ButtonLayout, ButtonLayoutOptions>

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

const glyphSizes = {
  standard: 's',
  compact: 'xs',
} satisfies Record<ButtonGlyphSize, IconSize>

const ButtonGlyphSizeContext = createContext<IconSize>(glyphSizes.standard)

export interface ButtonGlyphProps {
  /** SVG artwork rendered at the size selected by the surrounding button. */
  artwork: IconArtwork
}

export function ButtonGlyph({ artwork }: ButtonGlyphProps) {
  const size = useContext(ButtonGlyphSizeContext)
  return (
    <Icon
      artwork={artwork}
      size={size}
    />
  )
}

interface ButtonVisualStylesOptions {
  variant: ButtonVariant
  size: ButtonSize
  square: boolean
  pressed: boolean
  expanded?: boolean
  fill: boolean
  alignment: ButtonLayoutOptions['alignment']
  stacked?: boolean
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
  expanded = false,
  fill,
  alignment,
  stacked = false,
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
    expanded === true && expandedStyles[variant],
    radiusStyles[radius],
    orientation !== null && buttonGroupStyles.member,
    orientation === 'horizontal' && buttonGroupStyles.memberHorizontal,
    orientation === 'vertical' && buttonGroupStyles.memberVertical,
    fill === true && buttonStyles.fill,
    alignment === 'start' && buttonStyles.alignStart,
    stacked === true && buttonStyles.stacked,
    disabled === true && buttonStyles.disabled,
  ]
}

interface ButtonContentProps {
  children: ReactNode
  iconOnly?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
  loading?: boolean
  size: ButtonSize
  glyphSize?: ButtonGlyphSize
  layout?: ButtonLayout
}

export function ButtonContent({
  children,
  iconOnly = false,
  prefix,
  suffix,
  loading = false,
  size,
  glyphSize = 'standard',
  layout = 'inline',
}: ButtonContentProps) {
  const spinnerSize = spinnerSizes[size]
  const iconSize = glyphSizes[glyphSize]
  const loadingIndicator =
    loading === true ? (
      <span
        aria-hidden="true"
        data-slot="button-loading-indicator"
        {...stylex.props(buttonStyles.loadingIndicator)}
      >
        <Spinner size={spinnerSize} />
      </span>
    ) : null

  if (iconOnly === true) {
    return (
      <ButtonGlyphSizeContext.Provider value={iconSize}>
        <>
          <span
            aria-hidden="true"
            data-slot="button-icon"
            {...stylex.props(
              buttonStyles.iconSlot,
              loading === true && buttonStyles.loadingContent,
            )}
          >
            {children}
          </span>
          {loadingIndicator}
        </>
      </ButtonGlyphSizeContext.Provider>
    )
  }

  const prefixContent =
    prefix !== undefined ? (
      <span
        aria-hidden="true"
        {...stylex.props(buttonStyles.iconSlot)}
      >
        {prefix}
      </span>
    ) : null

  return (
    <ButtonGlyphSizeContext.Provider value={iconSize}>
      <>
        <span
          data-slot="button-content"
          {...stylex.props(
            buttonStyles.content,
            layout === 'stacked' && buttonStyles.contentStacked,
            loading === true && buttonStyles.loadingContent,
          )}
        >
          {prefixContent}
          {children}
          {suffix !== undefined ? (
            <span
              aria-hidden="true"
              {...stylex.props(buttonStyles.iconSlot)}
            >
              {suffix}
            </span>
          ) : null}
        </span>
        {loadingIndicator}
      </>
    </ButtonGlyphSizeContext.Provider>
  )
}
