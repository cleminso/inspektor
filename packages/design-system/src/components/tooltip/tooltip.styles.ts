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
  trigger: {
    padding: 0,
    borderStyle: 'none',
    appearance: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
  },
  positioner: {
    outline: 'none',
    zIndex: layerIndexes.tooltip,
    maxWidth: 'var(--available-width)',
  },
  popup: {
    borderRadius: borderRadii.xs,
    paddingBlock: spacing.xs,
    paddingInline: spacing.m,
    backgroundColor: backgroundColors['bg-inverse'],
    color: textColors['text-on-inverse'],
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
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
    height: spacing.xs,
    width: spacing.m,
  },
  arrowTop: { bottom: `calc(0px - ${spacing.xs})`, rotate: '0deg' },
  arrowBottom: { rotate: '180deg', top: `calc(0px - ${spacing.xs})` },
  arrowLeft: { right: `calc(0px - ${spacing.s})`, rotate: '-90deg' },
  arrowRight: { left: `calc(0px - ${spacing.s})`, rotate: '90deg' },
  arrowIcon: {
    fill: 'currentColor',
    display: 'block',
    height: spacing.xs,
    width: spacing.m,
  },
})
