import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { serializeTooltipPlayground, TooltipPlayground } from "./playground";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));

afterEach(cleanup);

describe("Tooltip playground", () => {
  it("serializes a safe representative composition", () => {
    const source = serializeTooltipPlayground({
      side: "right",
      align: "center",
      disabled: false,
      closeOnClick: true,
    });

    expect(source).toContain('import { Button, Tooltip } from "@inspector/ds";');
    expect(source).toContain("<Tooltip.Provider>");
    expect(source).toContain('<Tooltip.Content side="right">');
    expect(source).not.toContain("closeOnClick");
  });

  it("updates serialized trigger behavior from curated controls", () => {
    const { container } = render(<TooltipPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Close on click" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect(container.querySelector("pre")?.textContent).toContain("closeOnClick={false}");
  });
});
