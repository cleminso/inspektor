import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SidePanelLayout, SidePanelLayoutProvider, useSidePanelLayout } from "./layout";

interface PanelSize {
  asPercentage: number;
  inPixels: number;
}

const panel = vi.hoisted(() => ({
  collapse: vi.fn(),
  expand: vi.fn(),
}));

const resizable = vi.hoisted(() => ({
  onResize: undefined as ((size: PanelSize) => void) | undefined,
}));

vi.mock("@inspector/ds", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizableHandle: () => <div data-testid="resize-handle" />,
  ResizablePanel: ({
    children,
    onResize,
  }: {
    children: React.ReactNode;
    onResize?: (size: PanelSize) => void;
  }) => {
    if (onResize !== undefined) {
      resizable.onResize = onResize;
    }

    return <div>{children}</div>;
  },
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useResizablePanelRef: () => ({ current: panel }),
}));

afterEach(() => {
  cleanup();
  panel.collapse.mockClear();
  panel.expand.mockClear();
  resizable.onResize = undefined;
});

describe("SidePanelLayout", () => {
  it("starts open and toggles from a control outside the resizable layout", () => {
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
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("resize-handle")).toBeTruthy();

    fireEvent.click(toggle);

    expect(panel.collapse).toHaveBeenCalledOnce();
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByTestId("resize-handle")).toBeTruthy();

    fireEvent.click(toggle);

    expect(panel.expand).toHaveBeenCalledOnce();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("resize-handle")).toBeTruthy();
  });

  it("keeps the resize handle available after it collapses the panel", () => {
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

    act(() => {
      resizable.onResize?.({ asPercentage: 20, inPixels: 240 });
      resizable.onResize?.({ asPercentage: 0, inPixels: 0 });
    });

    const toggle = screen.getByRole("button", { name: "Toggle left dock" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByTestId("resize-handle")).toBeTruthy();

    fireEvent.click(toggle);

    expect(panel.expand).toHaveBeenCalledOnce();
  });
});
