import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'

export const brandNotFoundIllustrationStyles = stylex.create({
  root: {
    color: textColors.default,
    display: 'block',
    height: 'auto',
    maxWidth: '100%',
    width: '280px',
  },
})
