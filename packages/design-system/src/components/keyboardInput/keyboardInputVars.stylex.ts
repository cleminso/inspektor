/**
 * Inherited variables for KeyboardInput. StyleX requires files that export
 * `stylex.defineVars()` to export nothing else, so this module is separate from
 * `keyboardInput.styles.ts`. Ancestors such as danger-highlighted menu items
 * override the text color without prop drilling.
 */
import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'

export const keyboardInputVars = stylex.defineVars({
  textColor: {
    default: textColors.muted,
    ':hover': textColors.default,
  },
})
