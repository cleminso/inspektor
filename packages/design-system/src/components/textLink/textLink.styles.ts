import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'

export const textLinkStyles = stylex.create({
  base: {
    color: {
      default: textColors.default,
      ':focus-visible': textColors.link,
      ':hover': textColors.link,
    },
    textDecorationLine: 'none',
  },
})
