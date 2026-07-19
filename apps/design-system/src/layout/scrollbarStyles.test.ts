import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

describe("workspace scrollbar styles", () => {
  it("does not reserve an empty root scrollbar gutter", () => {
    expect(styles).not.toContain("scrollbar-gutter");
  });

  it("only customizes scrollbars for hover and fine-pointer devices", () => {
    const mediaQuery = "@media (hover: hover) and (pointer: fine)";
    const mediaQueryIndex = styles.indexOf(mediaQuery);

    expect(mediaQueryIndex).toBeGreaterThan(-1);
    expect(styles.slice(0, mediaQueryIndex)).not.toContain("scrollbar-width");
    expect(styles.slice(mediaQueryIndex)).toContain("scrollbar-width: thin");
    expect(styles.slice(mediaQueryIndex)).toContain("scrollbar-color: transparent transparent;");
    expect(styles.slice(mediaQueryIndex)).toContain("[data-scroll-area]:hover");
    expect(styles.slice(mediaQueryIndex)).toContain("oklch(0.145 0 0 / 12%)");
    expect(styles.slice(mediaQueryIndex)).toContain("oklch(1 0 0 / 12%)");
    expect(styles.slice(mediaQueryIndex)).not.toContain("/ 32%");
    expect(styles.slice(mediaQueryIndex)).toContain("width: 6px");
    expect(styles.slice(mediaQueryIndex)).toContain("::-webkit-scrollbar-thumb:hover");
  });
});
