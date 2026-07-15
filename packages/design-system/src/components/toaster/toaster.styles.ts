import * as stylex from '@stylexjs/stylex'

import { fontFamilies, fontSizes, lineHeights } from '../../tokens/value.stylex'

export const toasterStyles = stylex.create({
  toaster: {
    fontFamily: fontFamilies.sans,
  },
  toast: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
  },
})
