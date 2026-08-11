import * as stylex from '@stylexjs/stylex'

import { elementColors, textColors } from '../../tokens/semantics.stylex'
import { borderRadii, fontFamilies, spacing } from '../../tokens/value.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'

const pulse = stylex.keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.5 },
})

export const textBaseStyles = stylex.create({
  base: { margin: 0 },
})

export const textColorStyles = stylex.create({
  default: { color: textColors.default },
  muted: { color: textColors.muted },
  disabled: { color: textColors.disabled },
  link: { color: textColors.link },
  danger: { color: textColors.danger },
  error: { color: textColors.danger },
  inherit: {},
})

export const textAlignStyles = stylex.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  justify: { textAlign: 'justify' },
})

export const textWrapStyles = stylex.create({
  wrap: { textWrap: 'wrap' },
  nowrap: { textWrap: 'nowrap' },
  balance: { textWrap: 'balance' },
  pretty: { textWrap: 'pretty' },
})

export const textUtilityStyles = stylex.create({
  heading: {
    fontFeatureSettings: "'ss07' 1, 'ss08' 1, 'zero' 1, 'liga' 0",
  },
  lineThrough: { textDecorationLine: 'line-through' },
  monospace: { fontFamily: fontFamilies.mono },
  tabularNums: { fontVariantNumeric: 'tabular-nums' },
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  withTrailingIcon: {
    display: 'inline-block',
    position: 'relative',
    paddingRight: spacing.xl,
  },
  trailingIcon: {
    alignItems: 'center',
    display: 'inline-flex',
    lineHeight: '1lh',
    position: 'absolute',
    verticalAlign: 'top',
    height: '1lh',
    marginLeft: spacing.xs,
    width: '1em',
  },
})

export const textLoadingStyles = stylex.create({
  inline: {
    display: 'inline-block',
    position: 'relative',
  },
  placeholder: { visibility: 'hidden' },
  skeleton: {
    inset: 0,
    borderRadius: borderRadii.xs,
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationName: { default: pulse, [reducedMotion]: 'none' },
    animationTimingFunction: 'ease-in-out',
    backgroundColor: elementColors.default,
    position: 'absolute',
  },
  lines: {
    gap: spacing.s,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  line: {
    borderRadius: borderRadii.xs,
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationName: { default: pulse, [reducedMotion]: 'none' },
    animationTimingFunction: 'ease-in-out',
    backgroundColor: elementColors.default,
    display: 'block',
    height: '1em',
    width: '100%',
  },
  lastLine: { width: '70%' },
})
