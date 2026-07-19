import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ButtonGroupPlayground,
  ButtonGroupPreview,
  serializeButtonGroupPlayground,
} from "./playground";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));

afterEach(cleanup);

describe("Button Group playground", () => {
  it("serializes the initial related actions scenario", () => {
    expect(
      serializeButtonGroupPlayground({
        orientation: "horizontal",
        separator: false,
        text: false,
      }),
    ).toContain('<ButtonGroup aria-label="Document actions">');
  });

  it("updates the preview and source from the separator control", () => {
    const { container } = render(<ButtonGroupPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Separator" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect(screen.getByRole("separator")).toBeTruthy();
    expect(container.querySelector("pre")?.textContent).toContain("ButtonGroupSeparator");
  });

  it("uses a horizontal separator in a vertical group", () => {
    const state = {
      orientation: "vertical",
      separator: true,
      text: false,
    } as const;
    const { container } = render(<ButtonGroupPreview state={state} />);

    expect(
      container
        .querySelector('[data-slot="button-group-separator"]')
        ?.getAttribute("aria-orientation"),
    ).toBe("horizontal");
    expect(serializeButtonGroupPlayground(state)).toContain(
      '<ButtonGroupSeparator orientation="horizontal" />',
    );
  });

  it("resets the preview and source", () => {
    const { container } = render(<ButtonGroupPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Text label" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect(screen.queryByText("Document")).toBeNull();
    expect(container.querySelector("pre")?.textContent).not.toContain("ButtonGroupText");
  });
});
