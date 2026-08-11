import * as stylex from '@stylexjs/stylex'

import { borderColors } from '../tokens/semantics.stylex'
import { borderRadii } from '../tokens/value.stylex'
import { scrollbarVars } from './scrollbarVars.stylex'

export const scrollbarStyles = stylex.create({
  standard: {
    [scrollbarVars.thumbColor]: {
      default: 'transparent',
      ':focus-within': borderColors.subtle,
      ':hover': borderColors.subtle,
    },
    scrollbarColor: `${scrollbarVars.thumbColor} transparent`,
    scrollbarWidth: 'thin',
    '::-webkit-scrollbar-button': {
      display: 'none',
    },
    '::-webkit-scrollbar-corner': {
      backgroundColor: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      borderRadius: borderRadii.m,
      backgroundColor: scrollbarVars.thumbColor,
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
  },
  hidden: {
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
})
