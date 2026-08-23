import * as stylex from '@stylexjs/stylex'

import {
  borderColors,
  elementColors,
  focusColors,
  spatial,
  surfaceColors,
  textColors,
} from '../../tokens/semantics.stylex'
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'

export const textareaStyles = stylex.create({
  base: {
    margin: 0,
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    paddingBlock: spacing.s,
    paddingInline: spacing.m,
    appearance: 'none',
    backgroundColor: surfaceColors.default,
    boxSizing: 'border-box',
    color: textColors.default,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
    resize: 'vertical',
    minWidth: 0,
    '::placeholder': {
      color: textColors.muted,
    },
  },
  heightS: {
    minHeight: spatial['textarea-height-s'],
  },
  heightM: {
    minHeight: spatial['textarea-height-m'],
  },
  heightL: {
    minHeight: spatial['textarea-height-l'],
  },
  fontSans: {
    fontFamily: fontFamilies.sans,
  },
  fontMono: {
    fontFamily: fontFamilies.mono,
  },
  fullWidth: {
    width: '100%',
  },
  invalid: {
    borderColor: {
      default: borderColors.danger,
      ':focus-visible': borderColors.danger,
    },
    outlineColor: focusColors.ringDanger,
    outlineOffset: 0,
    outlineStyle: 'solid',
    outlineWidth: {
      default: 0,
      ':focus-visible': spatial['focus-ring-width'],
    },
  },
  disabled: {
    backgroundColor: {
      default: elementColors.disabled,
      ':hover': elementColors.disabled,
    },
    color: textColors.disabled,
    cursor: 'not-allowed',
    '::placeholder': {
      color: textColors.disabled,
    },
  },
  readOnly: {
    backgroundColor: {
      default: elementColors.default,
      ':hover': elementColors.default,
    },
    cursor: 'default',
  },
  valid: {},
  touched: {},
  dirty: {},
  filled: {},
  focused: {},
})
