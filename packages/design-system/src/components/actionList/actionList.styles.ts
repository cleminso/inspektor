import * as stylex from '@stylexjs/stylex'

import {
  elementColors,
  focusColors,
  ghostElementColors,
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
} from '../../tokens/value.stylex'
import { actionListVars } from './actionListVars.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'
const selectionVisibility = `clamp(0, calc(${actionListVars.selectionChecked} + ${actionListVars.selectionFocusVisible} + ${actionListVars.selectionHoverVisible}), 1)`

export const actionListStyles = stylex.create({
  root: {
    margin: 0,
    padding: 0,
    gap: spacing.xxs,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  item: {
    [actionListVars.selectionHoverVisible]: {
      default: '0',
      ':hover': '1',
    },
    borderRadius: borderRadii.xs,
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': ghostElementColors.hover,
    },
    color: { default: textColors.muted, ':hover': textColors.secondary, },
    display: 'flex',
    outlineColor: focusColors.ring,
    outlineOffset: -2,
    outlineStyle: {
      default: 'none',
      ':has([data-slot="action-list-trigger"]:focus-visible)': 'solid',
    },
    outlineWidth: spatial['focus-ring-width'],
    minWidth: 0,
    paddingRight: spacing.s,
    width: '100%',
  },
  itemActive: {
    backgroundColor: {
      default: elementColors.default,
      ':focus-within': elementColors.default,
      ':hover': elementColors.default,
    },
    color: {
      default: textColors.default,
      ':focus-within': textColors.default,
      ':hover': textColors.default,
    },
  },
  itemChecked: {
    backgroundColor: {
      default: ghostElementColors.selected,
      ':hover': ghostElementColors.selected,
    },
    color: {
      default: textColors.default,
      ':hover': textColors.default,
    },
  },
  trigger: {
    margin: 0,
    borderStyle: 'none',
    flex: '1',
    gap: spacing.s,
    overflow: 'hidden',
    paddingBlock: 0,
    paddingInline: spacing.s,
    textDecoration: 'none',
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.ui,
    outlineStyle: 'none',
    textAlign: 'start',
    userSelect: 'none',
    minHeight: spatial['collection-row-height-l'],
    minWidth: 0,
    width: '100%',
  },
  triggerDisabled: {
    color: textColors.disabled,
    cursor: 'not-allowed',
  },
  selectionControl: {
    [actionListVars.selectionChecked]: '0',
    [actionListVars.selectionFocusVisible]: {
      default: '0',
      ':has([data-slot="checkbox"]:focus-visible)': '1',
    },
    flexShrink: 0,
    position: 'relative',
    height: spatial['icon-size-s'],
    marginLeft: spacing.s,
    width: spatial['icon-size-s'],
  },
  selectionControlChecked: {
    [actionListVars.selectionChecked]: '1',
  },
  selectionIcon: {
    inset: 0,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    opacity: `calc(1 - ${selectionVisibility})`,
    pointerEvents: 'none',
    position: 'absolute',
    transitionDuration: {
      default: '100ms',
      [reducedMotion]: '0ms',
    },
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out',
  },
  selectionCheckbox: {
    inset: 0,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    opacity: selectionVisibility,
    position: 'absolute',
    transitionDuration: {
      default: '100ms',
      [reducedMotion]: '0ms',
    },
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out',
  },
  prefix: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    height: spatial['icon-size-s'],
    width: spatial['icon-size-s'],
  },
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  action: {
    padding: 0,
    borderRadius: borderRadii.xs,
    borderStyle: 'none',
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: {
      default: 'transparent',
      ':hover': ghostElementColors.hover,
    },
    color: textColors.muted,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    outlineColor: focusColors.ring,
    outlineOffset: -2,
    outlineStyle: {
      default: 'none',
      ':focus-visible': 'solid',
    },
    outlineWidth: spatial['focus-ring-width'],
    height: spatial['control-height-xs'],
    width: spatial['control-height-xs'],
  },
  actionDisabled: {
    color: textColors.disabled,
    cursor: 'not-allowed',
  },
})
