import * as stylex from "@stylexjs/stylex";

import { colors } from "./value.stylex";

export const semanticColors = stylex.defineVars({
  background: colors.background,
  foreground: colors.foreground,
});
