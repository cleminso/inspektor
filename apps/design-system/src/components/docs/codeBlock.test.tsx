import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CodeBlock } from "./codeBlock";

vi.mock("@/lib/shiki", () => ({
  useHighlightedCode: () =>
    '<pre class="shiki" style="background-color:#fff;--shiki-dark-bg:#0d1117"><code><span style="color:#000;--shiki-dark:#f0f6fc">code</span></code></pre>',
}));

afterEach(cleanup);

describe("CodeBlock", () => {
  it("exposes highlighted output to the shared Shiki theme selectors", () => {
    render(<CodeBlock source="code" />);

    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect(document.querySelector("[data-docs-code-content] .shiki")).toBeTruthy();
  });
});
