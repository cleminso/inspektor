import * as stylex from '@stylexjs/stylex'

import { jsonViewVars } from './jsonViewVars.stylex'
import {
  focusColors,
  ghostElementColors,
  spatial,
  surfaceColors,
  syntaxColors,
  textColors,
} from '../../tokens/semantics.stylex'
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'

export const jsonViewStyles = stylex.create({
  root: {
    position: 'relative',
    minWidth: 0,
    width: '100%',
  },
  rootRow: {
    backgroundColor: surfaceColors.default,
    position: 'sticky',
    zIndex: 1,
    top: 0,
    width: '100%',
  },
  rowContentGroup: {
    display: 'flex',
    minWidth: 0,
  },
  rootTrigger: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexGrow: 1,
  },
  rowInteractiveContent: {
    borderRadius: borderRadii.xs,
    alignItems: 'center',
    display: 'flex',
    minWidth: 0,
  },
  rootActions: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    marginInlineStart: 'auto',
  },
  tree: {
    color: textColors.default,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
    minWidth: 0,
    width: '100%',
  },
  item: {
    minWidth: 0,
    outline: 'none',
  },
  row: {
    borderRadius: borderRadii.xs,
    display: 'flex',
    maxWidth: '100%',
    minWidth: 0,
    width: 'fit-content',
  },
  interactiveRow: {
    backgroundColor: {
      default: 'transparent',
      ':hover': ghostElementColors.hover,
    },
    [jsonViewVars.disclosureColor]: {
      default: textColors.muted,
      ':hover': textColors.default,
    },
    cursor: 'pointer',
    userSelect: 'none',
  },
  focusedRow: {
    outlineColor: focusColors.ring,
    outlineOffset: -2,
    outlineStyle: 'solid',
    outlineWidth: spatial['focus-ring-width'],
  },
  group: {
    paddingInlineStart: spacing.l,
  },
  disclosureSlot: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    width: spatial['icon-size-m'],
  },
  disclosure: {
    padding: 0,
    borderRadius: borderRadii.xs,
    borderStyle: 'none',
    alignItems: 'center',
    appearance: 'none',
    color: jsonViewVars.disclosureColor,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    height: spatial['icon-size-m'],
    width: spatial['icon-size-m'],
  },
  disclosureIcon: {
    display: 'block',
    height: spatial['icon-size-xs'],
    width: spatial['icon-size-xs'],
  },
  content: {
    overflowWrap: 'anywhere',
    userSelect: 'text',
    whiteSpace: 'pre-wrap',
    minWidth: 0,
  },
  key: {
    color: syntaxColors['syntax-property'],
  },
  string: {
    color: syntaxColors['syntax-string'],
  },
  number: {
    color: syntaxColors['syntax-number'],
  },
  boolean: {
    color: syntaxColors['syntax-boolean'],
  },
  null: {
    color: syntaxColors['syntax-constant'],
  },
  punctuation: {
    color: syntaxColors['syntax-punctuation'],
  },
  mark: {
    backgroundColor: syntaxColors['syntax-mark-background'],
    color: syntaxColors['syntax-mark-foreground'],
  },
  activeMark: {
    backgroundColor: syntaxColors['syntax-mark-active-background'],
    color: syntaxColors['syntax-mark-foreground'],
  },
  inlineAction: {
    borderStyle: 'none',
    paddingBlock: 0,
    paddingInline: spacing.xs,
    textDecoration: {
      default: 'none',
      ':hover': 'underline',
    },
    appearance: 'none',
    backgroundColor: 'transparent',
    color: textColors.link,
    cursor: 'pointer',
    fontFamily: fontFamilies.mono,
    fontSize: 'inherit',
    lineHeight: 'inherit',
  },
  limitMessage: {
    color: textColors.muted,
    userSelect: 'none',
  },
  status: {
    paddingBlockEnd: spacing.xs,
  },
})
