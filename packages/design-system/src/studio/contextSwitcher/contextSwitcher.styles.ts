import * as stylex from '@stylexjs/stylex'

import { spacing } from '../../tokens/value.stylex'
import { comboboxStyleVars } from '../combobox/comboboxVars.stylex'

export const contextSwitcherStyles = stylex.create({
  triggerContent: {
    flex: '1',
    gap: spacing.s,
    overflow: 'hidden',
    alignItems: 'center',
    color: comboboxStyleVars.triggerTextColor,
    display: 'inline-flex',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
})
