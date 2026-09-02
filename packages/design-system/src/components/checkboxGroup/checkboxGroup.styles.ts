import * as stylex from '@stylexjs/stylex'

import {
  borderRadii,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'
import { focusColors, spatial, textColors } from '../../tokens/semantics.stylex'
import { checkboxGroupVars } from './checkboxGroupVars.stylex'

export const checkboxGroupStyles = stylex.create({
  list: {
    padding: spatial['popup-collection-padding'],
    overflow: 'clip',
    overscrollBehavior: 'contain',
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    [checkboxGroupVars.actionOpacity]: {
      default: 0,
      ':has([data-slot="checkbox"]:focus-visible)': 1,
      ':has([data-slot="checkbox-group-action"]:focus-visible)': 1,
      ':hover': 1,
    },
    [checkboxGroupVars.actionVisibility]: {
      default: 'hidden',
      ':has([data-slot="checkbox"]:focus-visible)': 'visible',
      ':has([data-slot="checkbox-group-action"]:focus-visible)': 'visible',
      ':hover': 'visible',
    },
    borderRadius: borderRadii.xs,
    gap: spacing.s,
    paddingInline: spatial['popup-item-inline-padding'],
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'grid',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.regular,
    gridTemplateColumns: `${spatial['icon-size-s']} minmax(0, 1fr)`,
    lineHeight: lineHeights.ui,
    userSelect: 'none',
    minHeight: spatial['collection-row-height-s'],
  },
  rowDeferred: {
    containIntrinsicBlockSize: `auto ${spatial['collection-row-height-s']}`,
    contentVisibility: 'auto',
  },
  rowDisabled: { color: textColors.disabled },
  optionButton: {
    padding: 0,
    borderWidth: 0,
    overflow: 'hidden',
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
    outlineColor: focusColors.ring,
    outlineOffset: -1,
    outlineStyle: 'solid',
    outlineWidth: { default: 0, ':focus-visible': spatial['focus-ring-width'] },
    userSelect: 'none',
    minWidth: 0,
    width: '100%',
  },
  optionButtonDisabled: { cursor: 'not-allowed' },
  optionText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  action: {
    color: textColors.muted,
    flexShrink: 0,
    marginInlineStart: 'auto',
    opacity: checkboxGroupVars.actionOpacity,
    visibility: checkboxGroupVars.actionVisibility,
  },
})
