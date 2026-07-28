import * as stylex from "@stylexjs/stylex";

import { textColors } from "../../tokens/semantics.stylex";
import { fontFamilies, fontSizes, lineHeights } from "../../tokens/value.stylex";

export const timestampValueStyles = stylex.create({
  preview: {
    color: textColors["text-default"],
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[2],
    lineHeight: lineHeights.normal,
    whiteSpace: "nowrap",
  },
});
