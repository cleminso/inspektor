import * as stylex from '@stylexjs/stylex'

import { layerIndexes } from '../../tokens/layers.stylex'
import { borderColors, focusColors, spatial, textColors } from '../../tokens/semantics.stylex'
import { borderRadii, spacing } from '../../tokens/value.stylex'

export const resizablePanelStyles = stylex.create({
  group: {
    outlineStyle: 'none',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
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
      default: borderColors.subtle,
      ':focus-visible': borderColors.focused,
      ':is([data-disabled])': borderColors.subtle,
      ':not([data-disabled]):hover': borderColors.default,
      ':not([data-disabled]):is([data-separator="active"])': borderColors.strong,
    },
    color: {
      default: borderColors.default,
      ':focus-visible': borderColors.focused,
      ':is([data-disabled])': textColors.disabled,
      ':not([data-disabled]):hover': borderColors.strong,
      ':not([data-disabled]):is([data-separator="active"])': borderColors.strong,
    },
    cursor: {
      default: 'col-resize',
      ':is([aria-orientation="horizontal"])': 'row-resize',
      ':is([data-disabled])': 'default',
    },
    display: 'flex',
    justifyContent: 'center',
    outlineStyle: 'none',
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
    '::after': {
      borderColor: focusColors.ring,
      borderRadius: borderRadii.m,
      borderStyle: {
        default: 'none',
        ':focus-visible': 'solid',
      },
      borderWidth: spatial['focus-ring-width'],
      content: '',
      pointerEvents: 'none',
      position: 'absolute',
      height: {
        default: spacing['3xl'],
        ':is([aria-orientation="horizontal"])': spacing.s,
      },
      width: {
        default: spacing.s,
        ':is([aria-orientation="horizontal"])': spacing['4xl'],
      },
    },
  },
  gutter: {
    backgroundColor: {
      default: 'transparent',
      ':focus-visible': 'transparent',
      ':is([data-disabled])': 'transparent',
      ':not([data-disabled]):hover': 'transparent',
      ':not([data-disabled]):is([data-separator="active"])': 'transparent',
    },
  },
  gutterHorizontal: {
    width: spatial['panel-gutter-size'],
  },
  gutterVertical: {
    height: spatial['panel-gutter-size'],
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
