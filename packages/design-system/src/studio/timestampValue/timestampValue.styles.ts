import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'
import { fontFamilies, fontSizes, lineHeights } from '../../tokens/value.stylex'

export const timestampValueStyles = stylex.create({
  preview: {
    color: textColors.default,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes[2],
    fontVariantNumeric: 'tabular-nums',
    lineHeight: lineHeights.ui,
    whiteSpace: 'nowrap',
  },
})
