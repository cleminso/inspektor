import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'
import { brandLayout } from '../page/layout.stylex'

export const brandWordmarkStyles = stylex.create({
  root: {
    color: textColors.default,
    display: 'block',
    flexShrink: 0,
    height: brandLayout.wordmarkHeight,
    width: brandLayout.wordmarkWidth,
  },
})
