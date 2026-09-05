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

export const inputStyles = stylex.create({
  base: {
    margin: 0,
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    paddingBlock: 0,
    paddingInline: spacing.s,
    appearance: 'none',
    backgroundColor: surfaceColors.default,
    boxSizing: 'border-box',
    color: textColors.default,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.ui,
    minWidth: 0,
    '::placeholder': {
      color: textColors.muted,
    },
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
  fontSans: {
    fontFamily: fontFamilies.sans,
  },
  fontMono: {
    fontFamily: fontFamilies.mono,
  },
  subtle: {
    borderColor: {
      default: 'transparent',
      ':focus-visible': borderColors.focused,
      ':hover': borderColors.default,
    },
    backgroundColor: surfaceColors.subtle,
  },
  fullWidth: {
    width: '100%',
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
  valid: {},
  touched: {},
  dirty: {},
  filled: {},
  focused: {},
})
