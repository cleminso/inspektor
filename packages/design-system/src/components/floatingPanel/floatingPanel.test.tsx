import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FloatingPanel } from "./floatingPanel";

afterEach(cleanup);

describe("FloatingPanel", () => {
  it("portals a labelled non-modal surface to the document body", () => {
    const { container } = render(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content>Review</FloatingPanel.Content>
      </FloatingPanel.Root>,
    );

    const panel = screen.getByRole("complementary", { name: "Pending changes" });
    expect(document.body.contains(panel)).toBe(true);
    expect(container.contains(panel)).toBe(false);
    expect(panel.getAttribute("role")).toBeNull();
    expect(document.querySelector("[data-slot='floating-panel-backdrop']")).toBeNull();
  });
});
