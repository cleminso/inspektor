import * as stylex from '@stylexjs/stylex'

import {
  backgroundColors,
  borderColors,
  spatial,
  textColors,
} from '../../tokens/semantics.stylex'
import {
  borderRadii,
  dimensions,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'

export const toggleGroupStyles = stylex.create({
  root: {
    padding: spacing.xxs,
    borderRadius: borderRadii.s,
    gap: spacing.xxs,
    overflow: 'clip',
    alignItems: 'stretch',
    backgroundColor: backgroundColors['bg-subtle'],
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
  rootFullWidth: {
    width: '100%',
  },
  rootSizeS: {
    height: spatial['control-height-s'],
  },
  rootSizeM: {
    height: spatial['control-height-m'],
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
      default: textColors['text-muted'],
      ':hover': textColors['text-default'],
    },
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.regular,
    justifyContent: 'center',
    lineHeight: lineHeights.none,
    outlineColor: borderColors['border-focused'],
    outlineOffset: 1,
    outlineStyle: {
      default: 'none',
      ':focus-visible': 'solid',
    },
    outlineWidth: spatial['focus-ring-width'],
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  itemSizeS: {
    height: dimensions[20],
  },
  itemSizeM: {
    height: dimensions[24],
  },
  itemPressed: {
    borderColor: borderColors['border'],
    backgroundColor: {
      default: backgroundColors['bg-popover'],
      ':hover': backgroundColors['bg-popover'],
      ':active': backgroundColors['bg-popover'],
    },
    color: textColors['text-default'],
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
      default: backgroundColors['bg-disabled'],
      ':hover': backgroundColors['bg-disabled'],
      ':active': backgroundColors['bg-disabled'],
    },
    color: textColors['text-disabled'],
    cursor: 'not-allowed',
  },
  itemPressedDisabled: {
    borderColor: {
      default: borderColors['border-secondary'],
      ':hover': borderColors['border-secondary'],
      ':active': borderColors['border-secondary'],
    },
  },
})
