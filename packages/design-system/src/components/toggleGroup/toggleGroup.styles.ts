import * as stylex from '@stylexjs/stylex'

import {
  borderColors,
  elementColors,
  focusColors,
  spatial,
  surfaceColors,
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

export const toggleGroupStyles = stylex.create({
  root: {
    padding: spacing.xxs,
    borderRadius: borderRadii.xs,
    gap: spacing.xxs,
    overflow: 'clip',
    alignItems: 'stretch',
    backgroundColor: surfaceColors.subtle,
    boxSizing: 'border-box',
    display: 'inline-flex',
    width: 'fit-content',
  },
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
  rootDisabled: {
    opacity: 0.6,
  },
  rootMultiple: {},
  rootFullWidth: {
    width: '100%',
  },
  rootSizeS: {
    height: spatial['control-height-s'],
  },
  rootSizeM: {
    height: spatial['control-height-m'],
  },
  rootSizeL: {
    height: spatial['control-height-l'],
  },
  item: {
    borderColor: 'transparent',
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    gap: spacing.s,
    paddingInline: spacing.m,
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    color: {
      default: textColors.muted,
      ':hover': textColors.secondary,
    },
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.regular,
    justifyContent: 'center',
    lineHeight: lineHeights.ui,
    outlineColor: focusColors.ring,
    outlineOffset: `calc(-1 * ${spatial['focus-ring-width']})`,
    outlineStyle: {
      default: 'none',
      ':focus-visible': 'solid',
    },
    outlineWidth: spatial['focus-ring-width'],
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  itemSizeS: {
    height: `calc(${spatial['control-height-s']} - ${spacing.xs})`,
  },
  itemSizeM: {
    height: `calc(${spatial['control-height-m']} - ${spacing.xs})`,
  },
  itemSizeL: {
    height: `calc(${spatial['control-height-l']} - ${spacing.xs})`,
  },
  itemPressed: {
    borderColor: borderColors.default,
    backgroundColor: {
      default: surfaceColors.raised,
      ':hover': surfaceColors.raised,
      ':active': surfaceColors.raised,
    },
    color: textColors.default,
  },
  itemEqualWidth: {
    flexBasis: '0%',
    flexGrow: '1',
    flexShrink: '1',
  },
  itemDisabled: {
    borderColor: {
      default: 'transparent',
      ':hover': 'transparent',
      ':active': 'transparent',
    },
    backgroundColor: {
      default: elementColors.disabled,
      ':hover': elementColors.disabled,
      ':active': elementColors.disabled,
    },
    color: textColors.disabled,
    cursor: 'not-allowed',
  },
  itemPressedDisabled: {
    borderColor: {
      default: borderColors.subtle,
      ':hover': borderColors.subtle,
      ':active': borderColors.subtle,
    },
  },
})
