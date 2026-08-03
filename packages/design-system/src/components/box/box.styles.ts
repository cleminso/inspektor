import * as stylex from '@stylexjs/stylex'

import { borderColors } from '../../tokens/semantics.stylex'
import { borderRadii, spacing } from '../../tokens/value.stylex'

export const boxStyles = stylex.create({
  scrollbarThin: {
    scrollbarColor: `${borderColors['border-secondary']} transparent`,
    scrollbarWidth: 'thin',
    '::-webkit-scrollbar': {
      width: spacing.m,
      height: spacing.m,
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: borderColors['border-secondary'],
      borderRadius: borderRadii.m,
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
  },
})
