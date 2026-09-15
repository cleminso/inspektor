import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'
import { fontFamilies, fontSizes, lineHeights, spacing } from '../../tokens/value.stylex'

export const relationValueStyles = stylex.create({
  compact: {
    gap: spacing.xs,
    alignItems: 'center',
    color: textColors.default,
    display: 'flex',
    minWidth: 0,
    width: '100%',
  },
  compactValue: {
    overflow: 'hidden',
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
  },
  compactId: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
  },
  compactNavigation: {
    gap: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    minWidth: 0,
    width: '100%',
  },
  compactNavigationValue: {
    overflow: 'hidden',
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
  },
  compactNavigationIcon: {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
  },
})
