import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { InspectorDock } from "./view";

afterEach(cleanup);

describe("InspectorDock", () => {
  it("opens and closes the left dock from one button", () => {
    function DockHarness(): React.ReactElement {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <InspectorDock
          leftDock={{
            isOpen,
            onToggle: () => setIsOpen((currentIsOpen) => currentIsOpen === false),
          }}
        />
      );
    }

    render(<DockHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Open left dock" }));

    const closeButton = screen.getByRole("button", { name: "Close left dock" });
    expect(closeButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(closeButton);

    expect(
      screen.getByRole("button", { name: "Open left dock" }).getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
