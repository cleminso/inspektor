import * as stylex from '@stylexjs/stylex'

import {
  backgroundColors,
  borderColors,
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
    outlineWidth: { default: 0, ':focus-visible': 2 },
    position: 'relative',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  primary: {
    backgroundColor: {
      default: backgroundColors['bg-primary'],
      ':hover': backgroundColors['bg-primary-hover'],
    },
    color: textColors['fg-primary'],
  },
  secondary: {
    backgroundColor: {
      default: backgroundColors['bg-secondary'],
      ':hover': backgroundColors['bg-hover'],
    },
    color: textColors['text-default'],
  },
  danger: {
    backgroundColor: {
      default: backgroundColors['bg-danger'],
      ':hover': backgroundColors['bg-danger-hover'],
    },
    color: textColors['fg-danger'],
  },
  ghost: {
    backgroundColor: {
      default: 'transparent',
      ':hover': backgroundColors['bg-hover'],
    },
    color: textColors['text-default'],
  },
  outline: {
    borderColor: borderColors['border'],
    backgroundColor: {
      default: 'transparent',
      ':hover': backgroundColors['bg-hover'],
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
  sizeS: {
    paddingInline: spacing.m,
    fontSize: fontSizes[2],
    height: 24,
  },
  sizeM: {
    paddingInline: spacing.l,
    fontSize: fontSizes[2],
    height: 28,
  },
  sizeL: {
    paddingInline: spacing.xl,
    fontSize: fontSizes[2],
    height: 32,
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
    borderColor: borderColors['border-secondary'],
    backgroundColor: backgroundColors['bg-disabled'],
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
  iconSlot: {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
  },
})
