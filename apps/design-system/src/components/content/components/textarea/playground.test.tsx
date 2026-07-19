import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { serializeTextareaPlayground, TextareaPlayground } from "./playground";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));

afterEach(cleanup);

describe("Textarea playground", () => {
  it("omits package defaults from the initial source", () => {
    expect(
      serializeTextareaPlayground({
        height: "m",
        font: "sans",
        fullWidth: true,
        invalid: false,
        disabled: false,
        readOnly: false,
      }),
    ).toBe(
      'import { Textarea } from "@inspector/ds";\n\nexport default function Example() {\n  return <Textarea aria-label="Notes" placeholder="Add notes" />;\n}',
    );
  });

  it("uses one state for the preview and source, then resets it", () => {
    const { container } = render(<TextareaPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Invalid" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));
    expect(screen.getByRole("textbox", { name: "Notes" }).getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(container.querySelector("pre")?.textContent).toContain("invalid");

    fireEvent.click(screen.getByRole("button", { name: "Reset controls" }));
    expect(screen.getByRole("textbox", { name: "Notes" }).getAttribute("aria-invalid")).toBeNull();
    expect(container.querySelector("pre")?.textContent).not.toContain("invalid");
  });
});
