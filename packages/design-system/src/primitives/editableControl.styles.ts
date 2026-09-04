import * as stylex from '@stylexjs/stylex'

import { borderColors, focusColors, spatial } from '../tokens/semantics.stylex'

export const editableControlStyles = stylex.create({
  groupedMember: {
    borderColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    flexBasis: '0%',
    flexGrow: 1,
    flexShrink: 1,
    outlineWidth: 0,
    height: '100%',
    minWidth: 0,
  },
  focusVisible: {
    borderColor: {
      default: borderColors.default,
      ':focus-visible': borderColors.focused,
    },
    outlineColor: focusColors.ring,
    outlineOffset: `calc(-1 * ${spatial['focus-ring-width']})`,
    outlineStyle: 'solid',
    outlineWidth: {
      default: 0,
      ':focus-visible': spatial['focus-ring-width'],
    },
  },
})
