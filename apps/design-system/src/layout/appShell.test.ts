import { describe, expect, it } from "vitest";

import { getAdjacentNavigationItems, getMainContentOverflowY } from "./appShell";

describe("getMainContentOverflowY", () => {
  it("delegates component scrolling to the component workspace", () => {
    expect(getMainContentOverflowY("/components/button")).toBe("hidden");
  });

  it("keeps standalone documentation pages scrollable", () => {
    expect(getMainContentOverflowY("/foundations/colors")).toBe("auto");
  });
});

describe("getAdjacentNavigationItems", () => {
  it("crosses from foundations into components", () => {
    expect(getAdjacentNavigationItems("/foundations/typography")).toMatchObject({
      previous: { href: "/foundations/colors" },
      next: { href: "/components/button" },
    });
  });

  it("wraps across the complete navigation registry", () => {
    expect(getAdjacentNavigationItems("/foundations/colors")).toMatchObject({
      previous: { href: "/components/toggle-group" },
      next: { href: "/foundations/typography" },
    });
  });
});
