import * as stylex from '@stylexjs/stylex'

import { layerIndexes } from '../../tokens/layers.stylex'
import { backgroundColors, spatial, textColors } from '../../tokens/semantics.stylex'
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'

export const tooltipStyles = stylex.create({
  positioner: {
    outline: 'none',
    zIndex: layerIndexes.tooltip,
    maxWidth: 'var(--available-width)',
  },
  popup: {
    borderRadius: borderRadii.s,
    paddingBlock: spacing.xs,
    paddingInline: spacing.m,
    backgroundColor: backgroundColors['bg-inverse'],
    color: textColors['fg-inverse'],
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.tight,
    overflowWrap: 'anywhere',
    transformOrigin: 'var(--transform-origin)',
    transitionDuration: { default: '100ms', [reducedMotion]: '0ms' },
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    maxWidth: spatial['popup-width-m'],
  },
  popupTransition: {
    opacity: 0,
    transform: 'scale(0.98)',
  },
  arrow: {
    color: backgroundColors['bg-inverse'],
    display: 'flex',
    height: 4,
    width: 8,
  },
  arrowTop: { bottom: -4, rotate: '0deg' },
  arrowBottom: { rotate: '180deg', top: -4 },
  arrowLeft: { right: -6, rotate: '-90deg' },
  arrowRight: { left: -6, rotate: '90deg' },
  arrowIcon: {
    fill: 'currentColor',
    display: 'block',
    height: 4,
    width: 8,
  },
})
