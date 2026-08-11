import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { InspectorDock } from "./view";

afterEach(cleanup);

describe("InspectorDock", () => {
  it("keeps a fixed semantic height", () => {
    const { container } = render(<InspectorDock />);
    const dock = container.querySelector("footer") as HTMLElement;

    expect(dock.style.height).toMatch(/^var\(--/);
    expect(dock.getAttribute("data-height")).toBe("fixed");
  });

  it("uses semantic extra-small icons without native tooltips", () => {
    render(<InspectorDock leftDock={{ isOpen: false, onToggle: () => undefined }} />);

    for (const name of ["Open left dock", "Open subscriptions dock"]) {
      const button = screen.getByRole("button", { name });
      const icon = button.querySelector('[data-slot="icon"]');
      expect(button.getAttribute("data-glyph-size")).toBe("compact");
      expect(icon?.getAttribute("data-size")).toBe("xs");
      expect(button.getAttribute("title")).toBeNull();
    }
  });

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
