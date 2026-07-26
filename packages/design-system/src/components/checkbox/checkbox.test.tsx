import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Checkbox } from "./checkbox";

afterEach(cleanup);

describe("Checkbox", () => {
  it("toggles when its visible label is clicked", () => {
    render(
      <Checkbox.Label>
        <Checkbox />
        Enable notifications
      </Checkbox.Label>,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Enable notifications" });
    fireEvent.click(screen.getByText("Enable notifications"));

    expect(checkbox.getAttribute("aria-checked")).toBe("true");
  });

  it("preserves checked disabled state without allowing a change", () => {
    let changeCount = 0;

    render(
      <Checkbox
        aria-label="Enable notifications"
        checked
        disabled
        onCheckedChange={() => {
          changeCount += 1;
        }}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Enable notifications" });
    fireEvent.click(checkbox);

    expect(checkbox.getAttribute("data-checked")).toBe("");
    expect(checkbox.getAttribute("data-disabled")).toBe("");
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    expect(changeCount).toBe(0);
  });

  it("focuses with Tab semantics and does not toggle with Enter", () => {
    render(<Checkbox aria-label="Enable notifications" nativeButton render={<button />} />);

    const checkbox = screen.getByRole("checkbox", { name: "Enable notifications" });
    checkbox.focus();

    expect(document.activeElement).toBe(checkbox);

    fireEvent.keyDown(checkbox, { key: "Enter" });
    fireEvent.keyUp(checkbox, { key: "Enter" });
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
  });
});
