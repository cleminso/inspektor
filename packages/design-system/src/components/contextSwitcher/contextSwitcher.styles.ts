import * as stylex from '@stylexjs/stylex'

import { spacing } from '../../tokens/value.stylex'

export const contextSwitcherStyles = stylex.create({
  trigger: {
    minWidth: 0,
    paddingInline: spacing.xs,
  },
  triggerWidthContent: {
    width: 'fit-content',
  },
  triggerWidthS: {
    maxWidth: 200,
  },
  triggerWidthM: {
    maxWidth: 280,
  },
  icon: {
    display: 'block',
    flexShrink: 0,
    height: 14,
    width: 14,
  },
})
