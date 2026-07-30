import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InspectorLayout } from "./layout";

vi.mock("./header/view", () => ({
  InspectorHeader: () => <header>Header</header>,
}));

afterEach(cleanup);

describe("InspectorLayout", () => {
  it("lets the viewport-height integration class define the root height", () => {
    const { container } = render(
      <InspectorLayout>
        <div>Content</div>
      </InspectorLayout>,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root.classList.contains("h-dvh")).toBe(true);
    expect(root.style.height).toBe("");
  });
});
