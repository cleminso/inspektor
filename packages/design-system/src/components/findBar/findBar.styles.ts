import * as stylex from '@stylexjs/stylex'

import { spatial } from '../../tokens/semantics.stylex'
import { fontFamilies, fontSizes, lineHeights, spacing } from '../../tokens/value.stylex'

export const findBarStyles = stylex.create({
  status: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontVariantNumeric: 'tabular-nums',
    lineHeight: lineHeights.compact,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  icon: {
    display: 'block',
    height: spatial['icon-size-s'],
    width: spatial['icon-size-s'],
  },
  optionIcon: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
  },
  wholeWordIcon: {
    textDecorationLine: 'underline',
    textDecorationThickness: 1,
    textUnderlineOffset: spacing.xxs,
  },
})
