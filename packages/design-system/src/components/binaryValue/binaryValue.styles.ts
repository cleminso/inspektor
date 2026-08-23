import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'
import { fontFamilies, fontSizes, lineHeights } from '../../tokens/value.stylex'

export const binaryValueStyles = stylex.create({
  preview: {
    color: textColors.default,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
    whiteSpace: 'nowrap',
  },
  inspection: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  visuallyHidden: {
    padding: 0,
    borderWidth: 0,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    position: 'absolute',
    whiteSpace: 'nowrap',
    height: 1,
    width: 1,
  },
})
