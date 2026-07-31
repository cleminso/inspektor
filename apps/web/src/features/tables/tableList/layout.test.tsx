import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SidePanelLayout, SidePanelLayoutProvider, useSidePanelLayout } from "./layout";

const panel = vi.hoisted(() => ({
  collapse: vi.fn(),
  expand: vi.fn(),
}));

vi.mock("@inspector/ds", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizableHandle: () => <div data-testid="resize-handle" />,
  ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useResizablePanelRef: () => ({ current: panel }),
}));

afterEach(() => {
  cleanup();
  panel.collapse.mockClear();
  panel.expand.mockClear();
});

describe("SidePanelLayout", () => {
  it("opens and closes the panel from a control outside the resizable layout", () => {
    function DockToggle(): React.ReactElement {
      const { isOpen, toggle } = useSidePanelLayout();

      return (
        <button type="button" aria-pressed={isOpen} onClick={toggle}>
          Toggle left dock
        </button>
      );
    }

    render(
      <SidePanelLayoutProvider>
        <DockToggle />
        <SidePanelLayout>
          <SidePanelLayout.Panel>Panel</SidePanelLayout.Panel>
          <SidePanelLayout.Content>Content</SidePanelLayout.Content>
        </SidePanelLayout>
      </SidePanelLayoutProvider>,
    );

    const toggle = screen.getByRole("button", { name: "Toggle left dock" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByTestId("resize-handle")).toBeNull();

    fireEvent.click(toggle);

    expect(panel.expand).toHaveBeenCalledOnce();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("resize-handle")).toBeTruthy();

    fireEvent.click(toggle);

    expect(panel.collapse).toHaveBeenCalledOnce();
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByTestId("resize-handle")).toBeNull();
  });
});
