import * as stylex from '@stylexjs/stylex'

import {
  borderRadii,
  dimensions,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'
import { badgeColors } from './badgeColors.stylex'

export const badgeStyles = stylex.create({
  root: {
    borderRadius: borderRadii.xs,
    paddingInline: spacing.xs,
    alignItems: 'center',
    backgroundColor: badgeColors.background,
    boxSizing: 'border-box',
    color: badgeColors.text,
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.medium,
    justifyContent: 'center',
    lineHeight: lineHeights.compact,
    whiteSpace: 'nowrap',
    minHeight: dimensions[20],
  },
})
