import * as stylex from '@stylexjs/stylex'

import { spacing, borderRadii } from '../../tokens/value.stylex'

export const brandProductPreviewStyles = stylex.create({
  root: {
    boxSizing: 'border-box',
    width: '100%',
  },
  content: {
    paddingInline: spacing.xl,
    boxSizing: 'border-box',
    paddingBottom: spacing['2xl'],
    width: '100%',
  },
  image: {
    borderRadius: borderRadii.xs,
    display: 'block',
    height: 'auto',
    maxWidth: '100%',
    width: '100%',
  },
})
