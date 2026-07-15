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
  item: {
    paddingInline: spacing.xl,
    borderColor: 'transparent',
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    gap: spacing.s,
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: {
      default: 'transparent',
      ':hover': backgroundColors['bg-surface-selected'],
    },
    color: {
      default: textColors['text-secondary'],
      ':hover': textColors['text-primary'],
    },
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.regular,
    height: 28,
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
  },
  itemPressed: {
    backgroundColor: {
      default: backgroundColors['bg-primary'],
      ':hover': backgroundColors['bg-primary'],
    },
    borderColor: borderColors['border'],
    color: textColors['text-primary'],
  },
  itemDisabled: {
    color: textColors['text-disabled'],
    cursor: 'not-allowed',
  },
})
