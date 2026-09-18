/**
 * Inherited variables for KeyboardInput. This dedicated variable module keeps
 * the contextual contract separate from concrete component styles. Ancestors
 * such as danger-highlighted menu items override the text color without prop
 * drilling.
 */
import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'

export const keyboardInputVars = stylex.defineVars({
  textColor: {
    default: textColors.muted,
    ':hover': textColors.default,
  },
})
