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
    alignItems: 'center',
    appearance: 'none',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    display: 'inline-flex',
    flexShrink: 0,
    gap: spacing.s,
    justifyContent: 'center',
    position: 'relative',
    // boxShadow: {
    //   default: 'none',
    //   ':focus-visible': `0 0 0 2px ${borderColors['border-focused']}`,
    // },
    cursor: {
      default: 'pointer',
      ':disabled': 'not-allowed',
    },
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.relaxed,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    outline: 'none',
    userSelect: 'none',
  },
  primary: {
    backgroundColor: {
      default: backgroundColors['bg-inverse'],
    },
    color: textColors['text-inverse'],
  },
  secondary: {
    backgroundColor: {
      default: backgroundColors['bg-secondary'],
      ':hover': backgroundColors['bg-secondary'],
      ':active': backgroundColors['bg-secondary'],
    },
    color: textColors['text-primary'],
  },
  danger: {
    backgroundColor: {
      default: backgroundColors['bg-danger'],
      ':hover': backgroundColors['bg-danger-hover'],
    },
    color: textColors['text-light'],
  },
  ghost: {
    backgroundColor: {
      default: 'transparent',
      ':hover': backgroundColors['bg-secondary'],
      ':active': backgroundColors['bg-secondary'],
    },
    color: textColors['text-primary'],
  },
  outline: {
    borderColor: borderColors['border'],
    backgroundColor: {
      default: 'transparent',
      ':hover': backgroundColors['bg-surface-hover'],
      ':active': backgroundColors['bg-surface-selected'],
    },
    color: textColors['text-primary'],
  },
  link: {
    backgroundColor: 'transparent',
    color: textColors['text-info'],
    paddingInline: 0,
    textDecorationLine: {
      default: 'none',
      ':hover': 'underline',
      ':active': 'underline',
    },
    textUnderlineOffset: 3,
  },
  sizeXS: {
    height: 20,
    paddingInline: spacing.s,
    fontSize: fontSizes[2],
  },
  sizeS: {
    height: 24,
    paddingInline: spacing.m,
    fontSize: fontSizes[2],
  },
  sizeM: {
    height: 28,
    paddingInline: spacing.l,
    fontSize: fontSizes[2],
  },
  sizeL: {
    height: 32,
    paddingInline: spacing.xl,
    fontSize: fontSizes[2],
  },
  iconS: {
    width: 24,
    height: 24,
    paddingInline: 0,
  },
  iconM: {
    width: 28,
    height: 28,
    paddingInline: 0,
  },
  iconL: {
    width: 32,
    height: 32,
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
    color: textColors['text-disabled'],
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  content: {
    alignItems: 'center',
    display: 'inline-flex',
    gap: spacing.s,
    justifyContent: 'center',
    lineHeight: lineHeights.none,
    minWidth: 0,
  },
  loadingContent: {
    opacity: 0,
  },
  loadingIndicator: {
    position: 'absolute',
    inset: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: spacing.m,
    height: spacing.m,
    borderRadius: borderRadii.xl,
    backgroundColor: 'currentColor',
  },
})
