import * as stylex from '@stylexjs/stylex'

import { surfaceColors } from '../../tokens/semantics.stylex'
import { borderRadii, spacing } from '../../tokens/value.stylex'

export const shellLayoutStyles = stylex.create({
  root: {
    padding: spacing.xs,
    gap: spacing.xs,
    overflow: 'hidden',
    backgroundColor: surfaceColors.canvas,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
  },
  fixedRegion: {
    borderRadius: borderRadii.xs,
    overflow: 'hidden',
    backgroundColor: surfaceColors.background,
    display: 'flex',
    flexShrink: 0,
    minWidth: 0,
    width: '100%',
  },
  surface: {
    overflow: 'hidden',
    backgroundColor: surfaceColors.background,
    display: 'flex',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
  },
  leftDock: {
    borderRadius: borderRadii.xs,
  },
  view: {
    borderRadius: borderRadii.xs,
    backgroundColor: 'transparent',
  },
  rightDock: {
    borderRadius: borderRadii.xs,
  },
})
