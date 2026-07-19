import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MenuPlayground, serializeMenuPlayground } from "./playground";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));

afterEach(cleanup);

describe("Menu playground", () => {
  it("serializes a safe representative composition", () => {
    const source = serializeMenuPlayground({
      width: "content",
      side: "bottom",
      align: "start",
      disabled: false,
      danger: true,
    });

    expect(source).toContain('import { Button, Menu } from "@inspector/ds";');
    expect(source).toContain("<Menu.Root>");
    expect(source).toContain('<Menu.Item variant="danger"');
    expect(source).not.toContain('width="content"');
  });

  it("updates preview source from curated controls", () => {
    const { container } = render(<MenuPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Disabled" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect(container.querySelector("pre")?.textContent).toContain("<Menu.Root disabled>");
  });
});
