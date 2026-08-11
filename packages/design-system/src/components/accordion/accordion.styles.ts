import * as stylex from '@stylexjs/stylex'

import {
  focusColors,
  ghostElementColors,
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
  rootFill: {
    gap: spacing.none,
    overflow: 'hidden',
    height: '100%',
    minHeight: 0,
  },
  rootDisabled: {},
  rootHorizontal: {},
  rootVertical: {},
  item: {
    minWidth: 0,
    width: '100%',
  },
  itemFill: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: spatial['tab-height'],
  },
  itemFillIndexed: {
    marginTop: spacing.xs,
  },
  itemOpen: {},
  itemClosed: {},
  itemDisabled: {},
  itemHorizontal: {},
  itemVertical: {},
  itemHidden: {},
  itemIndexed: {},
  header: {
    margin: 0,
  },
  headerFill: {
    flexShrink: 0,
  },
  headerOpen: {},
  headerClosed: {},
  headerDisabled: {},
  headerHorizontal: {},
  headerVertical: {},
  headerHidden: {},
  headerIndexed: {},
  trigger: {
    [accordionVars.indicatorTransform]: 'rotate(0deg)',
    borderRadius: borderRadii.xs,
    borderStyle: 'none',
    gap: spacing.s,
    paddingInline: spacing.s,
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: {
      default: 'transparent',
      ':hover': ghostElementColors.hover,
    },
    color: textColors.muted,
    cursor: 'pointer',
    display: 'flex',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.regular,
    justifyContent: 'space-between',
    lineHeight: lineHeights.ui,
    outlineColor: focusColors.ring,
    outlineOffset: -2,
    outlineStyle: {
      default: 'none',
      ':focus-visible': 'solid',
    },
    outlineWidth: spatial['focus-ring-width'],
    textAlign: 'start',
    userSelect: 'none',
    height: spatial['tab-height'],
    width: '100%',
  },
  triggerOpen: {
    [accordionVars.indicatorTransform]: 'rotate(90deg)',
  },
  triggerDisabled: {
    color: textColors.disabled,
    cursor: 'not-allowed',
  },
  triggerHorizontal: {},
  triggerVertical: {},
  triggerHidden: {},
  triggerIndexed: {},
  triggerValue: {},
  leading: {
    gap: spacing.xs,
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
    transitionDuration: {
      default: '150ms',
      [reducedMotion]: '0ms',
    },
    transitionProperty: 'height',
    transitionTimingFunction: 'ease-out',
    height: 'var(--accordion-panel-height)',
    overflowX: 'hidden',
    overflowY: 'hidden',
  },
  panelFill: {
    minHeight: 0,
    overflow: 'hidden',
  },
  panelTransitioning: {
    height: 0,
  },
  panelOpen: {},
  panelClosed: {},
  panelDisabled: {},
  panelHorizontal: {},
  panelVertical: {},
  panelHidden: {},
  panelIndexed: {},
  panelStarting: {},
  panelEnding: {},
})
