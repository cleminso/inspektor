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

export const toggleGroupStyles = stylex.create({
  root: {
    padding: spacing.xxs,
    borderRadius: borderRadii.s,
    gap: spacing.xxs,
    overflow: 'clip',
    alignItems: 'stretch',
    backgroundColor: backgroundColors['bg-secondary'],
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
  item: {
    borderColor: 'transparent',
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    gap: spacing.s,
    paddingInline: spacing.xl,
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: {
      default: 'transparent',
      ':hover': backgroundColors['bg-hover'],
    },
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
    outlineWidth: 2,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    height: 28,
  },
  itemPressed: {
    borderColor: borderColors['border'],
    backgroundColor: {
      default: backgroundColors['bg-selected'],
      ':hover': backgroundColors['bg-selected'],
    },
    color: textColors['text-default'],
  },
  itemEqualWidth: {
    flexBasis: '0%',
    flexGrow: '1',
    flexShrink: '1',
  },
  itemDisabled: {
    color: textColors['text-disabled'],
    cursor: 'not-allowed',
  },
})
