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
import { codeEditorVars } from './codeEditorVars.stylex'

export const codeEditorStyles = stylex.create({
  root: {
    [codeEditorVars.backgroundColor]: surfaceColors.default,
    borderColor: {
      default: borderColors.default,
      ':focus-within': borderColors.focused,
    },
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: codeEditorVars.backgroundColor,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    minWidth: 0,
    width: '100%',
  },
  rootFill: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  invalid: {
    borderColor: {
      default: borderColors.danger,
      ':focus-within': borderColors.danger,
    },
    outlineColor: focusColors.ringDanger,
    outlineOffset: 0,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  disabled: {
    [codeEditorVars.backgroundColor]: elementColors.disabled,
    color: textColors.disabled,
    cursor: 'not-allowed',
  },
  readOnly: {
    [codeEditorVars.backgroundColor]: elementColors.default,
  },
  viewport: {
    minHeight: 0,
    minWidth: 0,
    width: '100%',
  },
  viewportExpandedFill: {
    overflow: 'hidden',
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  fallbackInput: {
    padding: spacing.m,
    borderWidth: 0,
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
    color: 'inherit',
    display: 'block',
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
    outlineWidth: 0,
    resize: 'none',
    minHeight: spatial['viewport-height-s'],
    width: '100%',
  },
  fallbackInputExpanded: {
    minHeight: 0,
    paddingBottom: spacing.l,
    paddingTop: spacing.l,
  },
  fallbackInputExpandedFill: {
    height: '100%',
  },
  fallbackInputExpandedIntrinsic: {
    maxHeight: spatial['viewport-height-l'],
  },
  fallbackInputExpandedCapped: {
    height: spatial['viewport-height-l'],
  },
  loadError: {
    padding: spacing.xs,
    borderColor: borderColors.default,
    borderStyle: 'solid',
    color: textColors.danger,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
    borderTopWidth: 1,
  },
  toolbar: {
    padding: spacing.xs,
    borderColor: borderColors.default,
    borderStyle: 'solid',
    borderWidth: 0,
    gap: spacing.xxs,
    alignItems: 'center',
    backgroundColor: elementColors.default,
    boxSizing: 'content-box',
    display: 'flex',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    minHeight: spatial['control-height-s'],
  },
  icon: {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    display: 'block',
    height: spatial['icon-size-s'],
    width: spatial['icon-size-s'],
  },
})
