import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InputPlayground, serializeInputPlayground } from "./playground";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));

afterEach(cleanup);

describe("Input playground", () => {
  it("omits package defaults from the initial source", () => {
    expect(
      serializeInputPlayground({
        size: "m",
        variant: "default",
        font: "sans",
        fullWidth: false,
        invalid: false,
        disabled: false,
        readOnly: false,
      }),
    ).toBe(
      'import { Input } from "@inspector/ds";\n\nexport default function Example() {\n  return <Input aria-label="Email" placeholder="name@example.com" />;\n}',
    );
  });

  it("uses one state for the preview and source, then resets it", () => {
    const { container } = render(<InputPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Invalid" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));
    expect(screen.getByRole("textbox", { name: "Email" }).getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(container.querySelector("pre")?.textContent).toContain("invalid");

    fireEvent.click(screen.getByRole("button", { name: "Reset controls" }));
    expect(screen.getByRole("textbox", { name: "Email" }).getAttribute("aria-invalid")).toBeNull();
    expect(container.querySelector("pre")?.textContent).not.toContain("invalid");
  });
});
