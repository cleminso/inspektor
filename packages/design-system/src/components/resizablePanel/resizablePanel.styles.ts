import * as stylex from '@stylexjs/stylex'

import { layerIndexes } from '../../tokens/layers.stylex'
import { borderColors, spatial, textColors } from '../../tokens/semantics.stylex'
import { borderRadii, spacing } from '../../tokens/value.stylex'

export const resizablePanelStyles = stylex.create({
  group: {
    outlineStyle: 'none',
    minHeight: 0,
    minWidth: 0,
  },
  panel: {
    overflow: 'hidden',
    outlineStyle: 'none',
    minHeight: 0,
    minWidth: 0,
  },
  handle: {
    alignItems: 'center',
    backgroundColor: {
      default: borderColors['border-secondary'],
      ':focus-visible': borderColors['border-focused'],
      ':is([data-disabled])': borderColors['border-secondary'],
      ':not([data-disabled]):hover': borderColors.border,
      ':not([data-disabled]):is([data-separator="active"])': borderColors['border-focused'],
    },
    color: {
      default: borderColors.border,
      ':focus-visible': borderColors['border-focused'],
      ':is([data-disabled])': textColors['text-disabled'],
      ':not([data-disabled]):hover': borderColors['border-focused'],
      ':not([data-disabled]):is([data-separator="active"])': borderColors['border-focused'],
    },
    display: 'flex',
    justifyContent: 'center',
    outlineColor: borderColors['border-focused'],
    outlineOffset: -1,
    outlineStyle: {
      default: 'none',
      ':focus-visible': 'solid',
    },
    outlineWidth: {
      default: 0,
      ':focus-visible': spatial['focus-ring-width'],
    },
    position: 'relative',
    zIndex: {
      default: layerIndexes.navigation,
      ':not([data-disabled]):is([data-separator="active"])': layerIndexes.drag,
    },
    height: {
      default: '100%',
      ':is([aria-orientation="horizontal"])': spatial['panel-handle-size'],
    },
    width: {
      default: spatial['panel-handle-size'],
      ':is([aria-orientation="horizontal"])': '100%',
    },
  },
  grip: {
    borderRadius: borderRadii.m,
    backgroundColor: 'currentColor',
    flexShrink: 0,
    pointerEvents: 'none',
  },
  gripVertical: {
    height: spacing['3xl'],
    width: spacing.s,
  },
  gripHorizontal: {
    height: spacing.s,
    width: spacing['4xl'],
  },
})
