import * as stylex from '@stylexjs/stylex'

import { borderColors, focusColors, spatial } from '../../tokens/semantics.stylex'
import { layerIndexes } from '../../tokens/layers.stylex'
import { borderRadii, spacing } from '../../tokens/value.stylex'
import { scrollAreaVars } from './scrollAreaVars.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'

export const scrollAreaStyles = stylex.create({
  root: {
    [scrollAreaVars.focusOpacity]: {
      default: '0',
      ':focus-within': '1',
    },
    overflow: 'hidden',
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    position: 'relative',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
  },
  rootContent: {
    display: 'flex',
    flexBasis: 'auto',
    flexDirection: 'column',
    flexGrow: 0,
    height: 'auto',
  },
  maxHeightS: {
    maxHeight: spatial['viewport-height-s'],
  },
  maxHeightM: {
    maxHeight: spatial['viewport-height-m'],
  },
  maxHeightL: {
    maxHeight: spatial['viewport-height-l'],
  },
  viewport: {
    outlineColor: focusColors.ring,
    outlineOffset: -2,
    outlineStyle: {
      default: 'none',
      ':focus-visible': 'solid',
    },
    outlineWidth: spatial['focus-ring-width'],
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
  },
  viewportContent: {
    flexGrow: 1,
    flexShrink: 1,
    height: 'auto',
  },
  viewportFrequentScroll: {
    overflowAnchor: 'none',
    willChange: 'scroll-position',
  },
  viewportSizeContainer: {
    containerType: 'size',
  },
  viewportVertical: {
    overflowX: 'hidden',
    overflowY: 'scroll',
  },
  viewportNone: {
    overflow: 'hidden',
  },
  viewportBoth: {
    overflow: 'scroll',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  contentVertical: {
    minWidth: 0,
    width: '100%',
  },
  scrollbar: {
    display: 'flex',
    opacity: 0,
    pointerEvents: 'none',
    transitionDuration: {
      default: '100ms',
      [reducedMotion]: '0ms',
    },
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out',
    zIndex: layerIndexes.navigation,
  },
  scrollbarWithOverflow: {
    opacity: scrollAreaVars.focusOpacity,
  },
  scrollbarInteractive: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  scrollbarScrolling: {
    transitionDuration: '0ms',
  },
  scrollbarVertical: {
    paddingBlock: spacing.xxs,
    justifyContent: 'center',
    width: spatial['scrollbar-track-size'],
  },
  scrollbarHorizontal: {
    paddingInline: spacing.xxs,
    alignItems: 'center',
    height: spatial['scrollbar-track-size'],
  },
  verticalTrackOffsetM: {
    marginTop: spatial['collection-row-height-l'],
  },
  verticalTrackOffsetL: {
    marginTop: spatial['collection-row-height-xl'],
  },
  verticalTrackFlushEnd: {
    paddingBottom: 0,
  },
  thumb: {
    backgroundColor: {
      default: borderColors.subtle,
      ':hover': borderColors.strong,
    },
    borderRadius: borderRadii.m,
  },
  thumbVertical: {
    width: spatial['scrollbar-thumb-size'],
  },
  thumbHorizontal: {
    height: spatial['scrollbar-thumb-size'],
  },
  corner: {
    backgroundColor: 'transparent',
  },
})
