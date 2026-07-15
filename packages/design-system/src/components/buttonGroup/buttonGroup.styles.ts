import * as stylex from '@stylexjs/stylex'

import { borderColors } from '../../tokens/semantics.stylex'
import { spacing } from '../../tokens/value.stylex'

export const buttonGroupStyles = stylex.create({
  root: {
    gap: spacing.xxs,
    alignItems: 'stretch',
    display: 'inline-flex',
    width: 'fit-content',
  },
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
  separator: {
    alignSelf: 'stretch',
    backgroundColor: borderColors['border-secondary'],
    flexShrink: 0,
  },
  separatorHorizontal: {
    height: 1,
    width: 'auto',
  },
  separatorVertical: {
    height: 'auto',
    width: 1,
  },
})
