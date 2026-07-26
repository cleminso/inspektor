import * as stylex from '@stylexjs/stylex'

import {
  backgroundColors,
  borderColors,
  spatial,
  textColors,
} from '../../tokens/semantics.stylex'
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'

export const buttonStyles = stylex.create({
  base: {
    borderColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 1,
    gap: spacing.s,
    textDecoration: 'none',
    alignItems: 'center',
    appearance: 'none',
    cursor: {
      default: 'pointer',
      ':disabled': 'not-allowed',
    },
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.regular,
    justifyContent: 'center',
    lineHeight: lineHeights.relaxed,
    outlineColor: borderColors['border-focused'],
    outlineOffset: 2,
    outlineStyle: 'solid',
    outlineWidth: { default: 0, ':focus-visible': spatial['focus-ring-width'] },
    position: 'relative',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  primary: {
    backgroundColor: {
      default: backgroundColors['bg-primary'],
      ':hover': backgroundColors['bg-primary-hover'],
      ':active': backgroundColors['bg-primary-hover'],
    },
    color: textColors['fg-primary'],
  },
  secondary: {
    backgroundColor: {
      default: backgroundColors['bg-secondary'],
      ':hover': backgroundColors['bg-secondary-hover'],
      ':active': backgroundColors['bg-pressed'],
    },
    color: textColors['text-default'],
  },
  danger: {
    backgroundColor: {
      default: backgroundColors['bg-danger'],
      ':hover': backgroundColors['bg-danger-hover'],
      ':active': backgroundColors['bg-danger-hover'],
    },
    color: textColors['fg-danger'],
  },
  ghost: {
    backgroundColor: {
      default: 'transparent',
      ':hover': backgroundColors['bg-hover'],
      ':active': backgroundColors['bg-pressed'],
    },
    color: textColors['text-default'],
  },
  outline: {
    borderColor: borderColors['border'],
    backgroundColor: {
      default: 'transparent',
      ':hover': backgroundColors['bg-hover'],
      ':active': backgroundColors['bg-pressed'],
    },
    color: textColors['text-default'],
  },
  link: {
    paddingInline: 0,
    backgroundColor: 'transparent',
    color: textColors['text-link'],
    textDecorationLine: {
      default: 'none',
      ':hover': 'underline',
    },
    textUnderlineOffset: 3,
  },
  sizeXS: {
    paddingInline: spacing.s,
    fontSize: fontSizes[2],
    minHeight: spatial['control-height-xs'],
  },
  sizeS: {
    paddingInline: spacing.s,
    fontSize: fontSizes[2],
    minHeight: spatial['control-height-s'],
  },
  sizeM: {
    paddingInline: spacing.s,
    fontSize: fontSizes[2],
    minHeight: spatial['control-height-m'],
  },
  sizeL: {
    paddingInline: spacing.m,
    fontSize: fontSizes[2],
    minHeight: spatial['control-height-l'],
  },
  insetFlush: {
    paddingInline: spacing.xxs,
  },
  opticalPrefixCompact: {
    paddingInlineStart: `calc(${spacing.s} - ${spacing.xxs})`,
    paddingInlineEnd: `calc(${spacing.s} + ${spacing.xxs})`,
  },
  opticalSuffixCompact: {
    paddingInlineStart: `calc(${spacing.s} + ${spacing.xxs})`,
    paddingInlineEnd: `calc(${spacing.s} - ${spacing.xxs})`,
  },
  opticalPrefixLarge: {
    paddingInlineStart: `calc(${spacing.m} - ${spacing.xxs})`,
    paddingInlineEnd: `calc(${spacing.m} + ${spacing.xxs})`,
  },
  opticalSuffixLarge: {
    paddingInlineStart: `calc(${spacing.m} + ${spacing.xxs})`,
    paddingInlineEnd: `calc(${spacing.m} - ${spacing.xxs})`,
  },
  square: {
    aspectRatio: '1 / 1',
    paddingInline: 0,
  },
  radiusNone: {
    borderRadius: borderRadii.none,
  },
  radiusXS: {
    borderRadius: borderRadii.xs,
  },
  radiusS: {
    borderRadius: borderRadii.s,
  },
  radiusM: {
    borderRadius: borderRadii.m,
  },
  radiusL: {
    borderRadius: borderRadii.l,
  },
  radiusXL: {
    borderRadius: borderRadii.xl,
  },
  fullWidth: {
    width: '100%',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  justifyStart: {
    justifyContent: 'flex-start',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  disabled: {
    borderColor: 'transparent',
    backgroundColor: {
      default: backgroundColors['bg-disabled'],
      ':hover': backgroundColors['bg-disabled'],
      ':active': backgroundColors['bg-disabled'],
    },
    color: textColors['text-disabled'],
    cursor: 'not-allowed',
  },
  content: {
    gap: spacing.s,
    alignItems: 'center',
    display: 'inline-flex',
    justifyContent: 'center',
    lineHeight: lineHeights.none,
    minWidth: 0,
  },
  contentBetween: {
    justifyContent: 'space-between',
    width: '100%',
  },
  leadingContent: {
    gap: spacing.s,
    alignItems: 'center',
    display: 'inline-flex',
    minWidth: 0,
  },
  iconSlot: {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
  },
})
