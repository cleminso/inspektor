import * as stylex from '@stylexjs/stylex'

import {
  accentElementColors,
  borderColors,
  dangerElementColors,
  elementColors,
  focusColors,
  ghostElementColors,
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
    lineHeight: lineHeights.ui,
    outlineColor: focusColors.ring,
    outlineOffset: 1.5,
    outlineStyle: 'solid',
    outlineWidth: { default: 0, ':focus-visible': spatial['focus-ring-width'] },
    position: 'relative',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  primary: {
    backgroundColor: {
      default: accentElementColors.default,
      ':hover': accentElementColors.hover,
      ':active': accentElementColors.pressed,
    },
    color: textColors.onAccent,
  },
  secondary: {
    borderColor: borderColors.default,
    backgroundColor: {
      default: null,
      ':hover': elementColors.hover,
      ':active': ghostElementColors.pressed,
    },
    color: textColors.default,
  },
  danger: {
    backgroundColor: {
      default: dangerElementColors.default,
      ':hover': dangerElementColors.hover,
      ':active': dangerElementColors.pressed,
    },
    color: textColors.onDanger,
  },
  ghost: {
    backgroundColor: {
      default: 'transparent',
      ':hover': ghostElementColors.hover,
      ':active': ghostElementColors.pressed,
    },
    color: textColors.default,
  },
  link: {
    paddingInline: 0,
    backgroundColor: 'transparent',
    color: textColors.link,
    textDecorationLine: {
      default: 'none',
      ':hover': 'underline',
    },
    textUnderlineOffset: `calc(${spacing.s} / 2)`,
  },
  sizeXS: {
    paddingInline: spacing.xs,
    fontSize: fontSizes[2],
    height: spatial['control-height-xs'],
  },
  sizeS: {
    paddingInline: spacing.xs,
    fontSize: fontSizes[2],
    height: spatial['control-height-s'],
  },
  sizeM: {
    paddingInline: spacing.s,
    fontSize: fontSizes[2],
    height: spatial['control-height-m'],
  },
  withPrefix: {
    paddingInlineStart: `calc(${spacing.s} - ${spacing.xxs})`,
  },
  withSuffix: {
    paddingInlineEnd: `calc(${spacing.s} - ${spacing.xxs})`,
  },
  square: {
    aspectRatio: '1 / 1',
    paddingInline: 0,
  },
  pressed: {
    color: textColors.accent,
  },
  expandedPrimary: {
    backgroundColor: accentElementColors.pressed,
  },
  expandedSecondary: {
    backgroundColor: ghostElementColors.selected,
  },
  expandedDanger: {
    backgroundColor: dangerElementColors.pressed,
  },
  expandedGhost: {
    backgroundColor: ghostElementColors.selected,
  },
  expandedLink: {},
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
  fill: {
    width: '100%',
  },
  alignStart: {
    justifyContent: 'flex-start',
  },
  stacked: {
    paddingBlock: spacing.xs,
    height: 'auto',
    minHeight: spatial['control-height-m'],
  },
  disabled: {
    borderColor: 'transparent',
    backgroundColor: {
      default: elementColors.disabled,
      ':hover': elementColors.disabled,
      ':active': elementColors.disabled,
    },
    color: textColors.disabled,
    cursor: 'not-allowed',
  },
  disabledBare: {
    borderColor: 'transparent',
    backgroundColor: {
      default: 'transparent',
      ':hover': 'transparent',
      ':active': 'transparent',
    },
    color: textColors.disabled,
    cursor: 'not-allowed',
  },
  content: {
    gap: spacing.s,
    alignItems: 'center',
    display: 'inline-flex',
    justifyContent: 'center',
    lineHeight: lineHeights.ui,
    minWidth: 0,
  },
  contentStacked: {
    gap: spacing.xxs,
    alignItems: 'flex-start',
    flexDirection: 'column',
    width: '100%',
  },
  iconSlot: {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
  },
})
