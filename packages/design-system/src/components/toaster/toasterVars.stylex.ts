import * as stylex from '@stylexjs/stylex'

import { backgroundColors, textColors } from '../../tokens/semantics.stylex'

export const toasterVars = stylex.defineVars({
  actionBackground: backgroundColors['bg-subtle'],
  actionColor: textColors['text-default'],
  closeColor: textColors['text-muted'],
  descriptionColor: textColors['text-muted'],
  titleColor: textColors['text-default'],
})
