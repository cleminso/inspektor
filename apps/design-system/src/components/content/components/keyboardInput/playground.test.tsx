import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { KeyboardInputPlayground, serializeKeyboardInputPlayground } from "./playground";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));

afterEach(cleanup);

describe("KeyboardInput playground", () => {
  it("omits default props and serializes modifiers in component order", () => {
    expect(
      serializeKeyboardInputPlayground({
        keyName: "K",
        platform: "macos",
        size: "default",
        meta: true,
        ctrl: false,
        shift: true,
        alt: false,
      }),
    ).toContain('<KeyboardInput modifiers={["meta", "shift"]} platform="macos">K</KeyboardInput>');
  });

  it("updates and resets the keycap and generated source", () => {
    const { container } = render(<KeyboardInputPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Meta" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect(screen.getByLabelText("Control K")).toBeTruthy();
    expect(container.querySelector("pre")?.textContent).toContain('modifiers={["meta"]}');

    fireEvent.click(screen.getByRole("button", { name: "Reset controls" }));

    expect(screen.getByLabelText("K")).toBeTruthy();
    expect(container.querySelector("pre")?.textContent).not.toContain("modifiers");
  });
});
