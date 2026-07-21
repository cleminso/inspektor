import * as stylex from '@stylexjs/stylex'

import {
  backgroundColors,
  borderColors,
  spatial,
  textColors,
} from '../../tokens/semantics.stylex'
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
  borderRadii,
} from '../../tokens/value.stylex'
import { accordionVars } from './accordionVars.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'

export const accordionStyles = stylex.create({
  root: {
    gap: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  item: {
    minWidth: 0,
    width: '100%',
  },
  header: {
    margin: 0,
  },
  trigger: {
    [accordionVars.indicatorTransform]: 'rotate(0deg)',
    borderStyle: 'none',
    borderRadius: borderRadii.xs,
    gap: spacing.s,
    paddingInline: spacing.s,
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: {
      default: 'transparent',
      ':hover': backgroundColors['bg-hover'],
    },
    color: textColors['text-muted'],
    cursor: 'pointer',
    display: 'flex',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.regular,
    justifyContent: 'space-between',
    lineHeight: lineHeights.tight,
    outlineColor: borderColors['border-focused'],
    outlineOffset: -2,
    outlineStyle: {
      default: 'none',
      ':focus-visible': 'solid',
    },
    outlineWidth: spatial['focus-ring-width'],
    textAlign: 'start',
    userSelect: 'none',
    minHeight: spatial['control-height-s'],
    width: '100%',
  },
  triggerOpen: {
    [accordionVars.indicatorTransform]: 'rotate(90deg)',
  },
  triggerDisabled: {
    color: textColors['text-disabled'],
    cursor: 'not-allowed',
  },
  leading: {
    gap: spacing.s,
    alignItems: 'center',
    display: 'flex',
    minWidth: 0,
  },
  indicator: {
    display: 'block',
    flexShrink: 0,
    transform: accordionVars.indicatorTransform,
    transitionDuration: {
      default: '100ms',
      [reducedMotion]: '0ms',
    },
    transitionProperty: 'transform',
    transitionTimingFunction: 'ease-out',
    height: spatial['icon-size-s'],
    width: spatial['icon-size-s'],
  },
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  suffix: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  panel: {
    overflow: 'hidden',
    transitionDuration: {
      default: '150ms',
      [reducedMotion]: '0ms',
    },
    transitionProperty: 'height',
    transitionTimingFunction: 'ease-out',
    height: 'var(--accordion-panel-height)',
  },
  panelTransitioning: {
    height: 0,
  },
})
