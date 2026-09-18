/**
 * Inherited variables for InputGroup. This dedicated variable module keeps the
 * contextual contract separate from concrete component styles. `Field` and
 * `InputGroup` override these variables to express invalid and disabled states
 * without prop drilling.
 */
import * as stylex from '@stylexjs/stylex'

import { borderColors, focusColors, surfaceColors, textColors } from '../../tokens/semantics.stylex'

export const inputGroupVars = stylex.defineVars({
  backgroundColor: surfaceColors.default,
  borderColor: borderColors.default,
  focusedBorderColor: borderColors.focused,
  outlineColor: focusColors.ring,
  outlineWidth: '0px',
  textColor: textColors.default,
})
