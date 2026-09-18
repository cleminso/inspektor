import * as stylex from '@stylexjs/stylex'

import { borderColors, textColors } from '../../tokens/semantics.stylex'
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'

export const fieldsetStyles = stylex.create({
  root: {
    margin: 0,
    padding: 0,
    borderWidth: 0,
    gap: spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    width: '100%',
  },
  legend: {
    color: textColors.default,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[3],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    borderBottomColor: borderColors.default,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    paddingBottom: spacing.m,
    width: '100%',
  },
  disabled: {
    color: textColors.disabled,
  },
  rootDisabled: {},
  legendDisabled: {},
})
