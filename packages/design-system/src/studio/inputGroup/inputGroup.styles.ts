import * as stylex from '@stylexjs/stylex'

import { interactiveControlVars } from '../../primitives/interactiveControlVars.stylex'
import {
  borderColors,
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
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'
import { inputGroupVars } from './inputGroupVars.stylex'

export const inputGroupStyles = stylex.create({
  root: {
    borderColor: inputGroupVars.borderColor,
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'stretch',
    backgroundColor: inputGroupVars.backgroundColor,
    boxSizing: 'border-box',
    color: inputGroupVars.textColor,
    display: 'flex',
    outlineColor: inputGroupVars.outlineColor,
    outlineOffset: `calc(-1 * ${spatial['focus-ring-width']})`,
    outlineStyle: 'solid',
    outlineWidth: inputGroupVars.outlineWidth,
    minWidth: 0,
  },
  focusVisible: {
    borderColor: inputGroupVars.focusedBorderColor,
    outlineWidth: spatial['focus-ring-width'],
  },
  sizeXS: {
    height: spatial['control-height-xs'],
  },
  sizeS: {
    height: spatial['control-height-s'],
  },
  sizeM: {
    height: spatial['control-height-m'],
  },
  sizeL: {
    height: spatial['control-height-l'],
  },
  fullWidth: {
    width: '100%',
  },
  invalid: {
    [inputGroupVars.borderColor]: borderColors.danger,
    [inputGroupVars.focusedBorderColor]: borderColors.danger,
    [inputGroupVars.outlineColor]: focusColors.ringDanger,
  },
  disabled: {
    [inputGroupVars.backgroundColor]: elementColors.disabled,
    [inputGroupVars.textColor]: textColors.disabled,
  },
  text: {
    paddingInline: spacing.s,
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
    whiteSpace: 'nowrap',
  },
  prefix: {
    borderInlineEndColor: borderColors.subtle,
    borderInlineEndStyle: 'solid',
    borderInlineEndWidth: 1,
    color: textColors.muted,
  },
  suffix: {
    borderInlineStartColor: borderColors.subtle,
    borderInlineStartStyle: 'solid',
    borderInlineStartWidth: 1,
    color: textColors.muted,
  },
  action: {
    margin: 0,
    padding: 0,
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    borderBlockEndWidth: 0,
    borderBlockStartWidth: 0,
    borderInlineEndWidth: 0,
    borderInlineStartColor: borderColors.subtle,
    borderInlineStartStyle: 'solid',
    borderInlineStartWidth: 1,
    boxSizing: 'border-box',
    color: {
      default: textColors.muted,
      ':hover:not([data-disabled])': textColors.default,
    },
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    outlineColor: focusColors.ring,
    outlineOffset: `calc(-1 * ${spatial['focus-ring-width']})`,
    outlineStyle: 'solid',
    outlineWidth: {
      default: 0,
      ':focus-visible': spatial['focus-ring-width'],
    },
  },
  actionPressed: {
    backgroundColor: ghostElementColors.selected,
  },
  link: {
    textDecorationLine: 'none',
  },
  actionXS: {
    minWidth: `calc(${spatial['control-height-xs']} - 2px)`,
  },
  actionS: {
    minWidth: `calc(${spatial['control-height-s']} - 2px)`,
  },
  actionM: {
    minWidth: `calc(${spatial['control-height-m']} - 2px)`,
  },
  actionL: {
    minWidth: `calc(${spatial['control-height-l']} - 2px)`,
  },
  checkboxField: {
    [interactiveControlVars.hoverBorderColor]: {
      default: borderColors.default,
      ':hover': borderColors.strong,
    },
    gap: spacing.s,
    paddingInline: spacing.m,
    alignItems: 'center',
    borderInlineStartColor: borderColors.subtle,
    borderInlineStartStyle: 'solid',
    borderInlineStartWidth: 1,
    color: textColors.muted,
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
    whiteSpace: 'nowrap',
  },
  memberDisabled: {
    backgroundColor: {
      default: 'transparent',
      ':hover': 'transparent',
      ':active': 'transparent',
    },
    color: textColors.disabled,
    cursor: 'not-allowed',
  },
  actionDisabled: {},
  checkboxDisabled: {},
  checkboxValid: {},
  checkboxInvalid: {},
  checkboxTouched: {},
  checkboxDirty: {},
  checkboxFilled: {},
  checkboxFocused: {},
})
