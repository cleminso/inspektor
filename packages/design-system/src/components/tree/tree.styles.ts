import * as stylex from '@stylexjs/stylex'

import {
  borderColors,
  focusColors,
  elementColors,
  selectionColors,
  spatial,
  textColors,
} from '../../tokens/semantics.stylex'
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
  dimensions,
} from '../../tokens/value.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'
const itemHoverBackground = `color-mix(in oklch, ${elementColors.default} 65%, transparent)`

const row = {
  borderRadius: borderRadii.xs,
  paddingBlock: 0,
  paddingInline: spacing.s,
  alignItems: 'center',
  color: { default: textColors.secondary, ':hover': textColors.default },
  display: 'flex',
  fontFamily: fontFamilies.sans,
  fontSize: fontSizes[2],
  fontWeight: fontWeights.regular,
  lineHeight: lineHeights.ui,
  minHeight: spatial['collection-row-height-l'],
  minWidth: 0,
  textAlign: 'start',
  width: '100%',
} as const

export const treeStyles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    width: '100%',
  },
  sectionItem: {
    width: '100%',
  },
  section: {
    width: '100%',
  },
  sectionOpen: {},
  sectionClosed: {},
  sectionDisabled: {},
  sectionStarting: {},
  sectionEnding: {},
  trigger: {
    ...row,
    borderStyle: 'none',
    appearance: 'none',
    backgroundColor: {
      default: 'transparent',
      ':hover': itemHoverBackground,
    },
    cursor: 'pointer',
    outlineColor: focusColors.ring,
    outlineOffset: -2,
    outlineStyle: {
      default: 'none',
      ':focus-visible': 'solid',
    },
    outlineWidth: spatial['focus-ring-width'],
    userSelect: 'none',
  },
  triggerOpen: {},
  triggerClosed: {},
  triggerDisabled: {
    backgroundColor: { default: 'transparent', ':hover': 'transparent' },
    color: { default: textColors.disabled, ':hover': textColors.disabled },
    cursor: 'not-allowed',
  },
  triggerStarting: {},
  triggerEnding: {},
  content: {
    overflow: 'hidden',
  },
  contentOpen: {},
  contentClosed: {},
  contentDisabled: {},
  contentStarting: {},
  contentEnding: {},
  branch: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    position: 'relative',
    borderLeftColor: borderColors.subtle,
    borderLeftStyle: 'solid',
    borderLeftWidth: dimensions[1],
    marginLeft: spacing.l,
    paddingLeft: spacing.xs,
  },
  item: {
    width: '100%',
  },
  itemIndicator: {
    backgroundColor: selectionColors.border,
    pointerEvents: 'none',
    position: 'absolute',
    transitionDuration: {
      default: '180ms',
      [reducedMotion]: '0ms',
    },
    transitionProperty: 'transform',
    transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
    height: spatial['collection-row-height-l'],
    left: `calc(-1 * ${dimensions[1]})`,
    top: 0,
    width: dimensions[1],
  },
  itemLink: {
    ...row,
    backgroundColor: {
      default: 'transparent',
      ':hover': itemHoverBackground,
    },
    cursor: 'pointer',
    outlineColor: focusColors.ring,
    outlineOffset: -2,
    outlineStyle: {
      default: 'none',
      ':focus-visible': 'solid',
    },
    outlineWidth: spatial['focus-ring-width'],
    textDecorationLine: 'none',
    transitionDuration: {
      default: '100ms',
      [reducedMotion]: '0ms',
    },
    transitionProperty: 'background-color, color',
    transitionTimingFunction: 'ease-out',
  },
  itemLinkCurrent: {
    backgroundColor: {
      default: elementColors.default,
      ':hover': elementColors.hover,
    },
    color: textColors.default,
  },
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})
