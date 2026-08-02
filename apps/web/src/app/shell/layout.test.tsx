import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InspectorLayout } from "./layout";

vi.mock("./header/view", () => ({
  InspectorHeader: () => <header>Header</header>,
}));

afterEach(cleanup);

describe("InspectorLayout", () => {
  it("uses the constrained viewport height without an integration class", () => {
    const { container } = render(
      <InspectorLayout>
        <div>Content</div>
      </InspectorLayout>,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root.classList.contains("h-dvh")).toBe(false);
    expect(root.className).not.toBe("");
    expect(root.style.height).toMatch(/^var\(--/);
  });
});
