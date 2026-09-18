import * as stylex from '@stylexjs/stylex'

import { layerIndexes } from '../../tokens/layers.stylex'
import { borderColors, spatial, surfaceColors } from '../../tokens/semantics.stylex'
import { borderRadii, dimensions, shadows, spacing } from '../../tokens/value.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'

export const floatingPanelStyles = stylex.create({
  root: {
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: layerIndexes.floating,
    bottom: spacing['3xl'],
    left: spacing.xl,
    right: spacing.xl,
  },
  content: {
    borderColor: borderColors.default,
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: surfaceColors.raised,
    boxShadow: shadows.medium,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
    transitionProperty: 'width',
    maxHeight: 'min(70vh, 42.5rem)',
    maxWidth: '100%',
    minWidth: 0,
  },
  contentCompact: {
    transitionDuration: {
      default: '120ms',
      [reducedMotion]: '0ms',
    },
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
    width: dimensions[400],
  },
  contentExpanded: {
    transitionDuration: {
      default: '160ms',
      [reducedMotion]: '0ms',
    },
    transitionTimingFunction: 'cubic-bezier(0.77, 0, 0.175, 1)',
    width: spatial['content-measure'],
  },
  details: {
    overflow: 'hidden',
  },
  summary: {
    gap: spacing.xs,
    paddingBlock: spacing.s,
    paddingInline: spacing.s,
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  actions: {
    gap: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    minWidth: 0,
  },
})
