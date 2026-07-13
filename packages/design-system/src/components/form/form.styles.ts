import * as stylex from "@stylexjs/stylex";

import { spacing } from "../../tokens/value.stylex";

export const formStyles = stylex.create({
  root: {
    gap: spacing.xl,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    width: "100%",
  },
});
