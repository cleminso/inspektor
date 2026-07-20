import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'

export const textLinkStyles = stylex.create({
  base: {
    color: {
      default: textColors['text-default'],
      ':focus-visible': textColors['text-link'],
      ':hover': textColors['text-link'],
    },
    textDecorationLine: {
      default: 'none',
      ':focus-visible': 'underline',
      ':hover': 'underline',
    },
    textUnderlineOffset: 3,
  },
})
