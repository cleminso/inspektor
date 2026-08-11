import * as stylex from '@stylexjs/stylex'

import {
  borderColors,
  elementColors,
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

export const buttonGroupStyles = stylex.create({
  root: {
    gap: spacing.none,
    alignItems: 'stretch',
    display: 'inline-flex',
    isolation: 'isolate',
    width: 'fit-content',
  },
  member: {
    position: 'relative',
    zIndex: { default: 0, ':focus-visible': 1, ':active': 1 },
  },
  memberHorizontal: {
    borderEndEndRadius: { default: borderRadii.none, ':last-child': null },
    borderEndStartRadius: { default: borderRadii.none, ':first-child': null },
    borderInlineStartWidth: { default: 0, ':first-child': null },
    borderStartEndRadius: { default: borderRadii.none, ':last-child': null },
    borderStartStartRadius: { default: borderRadii.none, ':first-child': null },
  },
  memberVertical: {
    borderBlockStartWidth: { default: 0, ':first-child': null },
    borderEndEndRadius: { default: borderRadii.none, ':last-child': null },
    borderEndStartRadius: { default: borderRadii.none, ':last-child': null },
    borderStartEndRadius: { default: borderRadii.none, ':first-child': null },
    borderStartStartRadius: { default: borderRadii.none, ':first-child': null },
  },
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
  text: {
    borderColor: borderColors.default,
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    gap: spacing.s,
    paddingInline: spacing.m,
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: elementColors.default,
    color: textColors.default,
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.ui,
    whiteSpace: 'nowrap',
  },
  separator: {
    alignSelf: 'stretch',
    backgroundColor: borderColors.subtle,
    flexShrink: 0,
  },
  separatorHorizontal: {
    height: 1,
    width: 'auto',
  },
  separatorVertical: {
    height: 'auto',
    width: 1,
  },
})
