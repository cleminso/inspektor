import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { KeyboardInput } from "./keyboardInput";

afterEach(cleanup);

describe("KeyboardInput", () => {
  it("renders a semantic keyboard shortcut with ordered modifiers", () => {
    render(
      <KeyboardInput modifiers={["shift", "meta", "alt"]} platform="macos">
        K
      </KeyboardInput>,
    );

    const shortcut = screen.getByLabelText("Command Shift Option K");

    expect(shortcut.tagName).toBe("KBD");
    expect(shortcut.getAttribute("aria-label")).toBe("Command Shift Option K");
    expect(shortcut.getAttribute("data-slot")).toBe("keyboard-input");
  });

  it("uses Control for meta on non-macOS platforms", () => {
    render(
      <KeyboardInput modifiers={["meta", "shift"]} platform="other">
        K
      </KeyboardInput>,
    );

    expect(screen.getByLabelText("Control Shift K").textContent).toBe("Ctrl⇧K");
  });
});
