import * as stylex from '@stylexjs/stylex'

import { borderColors } from '../../tokens/semantics.stylex'
import { borderRadii, spacing } from '../../tokens/value.stylex'

export const resizablePanelStyles = stylex.create({
  group: {
    minHeight: 0,
    minWidth: 0,
  },
  panel: {
    overflow: 'hidden',
    minHeight: 0,
    minWidth: 0,
  },
  handle: {
    alignItems: 'center',
    backgroundColor: {
      default: borderColors['border-secondary'],
      ':focus-visible': borderColors['border-focused'],
      ':is([data-separator="active"])': borderColors['border-focused'],
      ':hover': borderColors.border,
    },
    color: {
      default: borderColors.border,
      ':focus-visible': borderColors['border-focused'],
      ':is([data-separator="active"])': borderColors['border-focused'],
      ':hover': borderColors['border-focused'],
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
      ':focus-visible': 1,
    },
    position: 'relative',
    height: {
      default: '100%',
      ':is([aria-orientation="horizontal"])': 1,
    },
    width: {
      default: 1,
      ':is([aria-orientation="horizontal"])': '100%',
    },
  },
  grip: {
    borderRadius: borderRadii.xl,
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
