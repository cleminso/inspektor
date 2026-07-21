import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SidePanelLayout } from "./sidePanelLayout";

const panel = vi.hoisted(() => ({
  collapse: vi.fn(),
  expand: vi.fn(),
  isCollapsed: vi.fn(() => false),
}));

vi.mock("@inspector/ds", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  ResizableHandle: () => <div data-testid="resize-handle" />,
  ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useResizablePanelRef: () => ({ current: panel }),
}));

afterEach(() => {
  cleanup();
  panel.collapse.mockClear();
  panel.expand.mockClear();
  panel.isCollapsed.mockReset();
  panel.isCollapsed.mockReturnValue(false);
});

describe("SidePanelLayout", () => {
  it("shares the panel toggle with content descendants", () => {
    render(
      <SidePanelLayout>
        <SidePanelLayout.Panel>Panel</SidePanelLayout.Panel>
        <SidePanelLayout.Content>
          <SidePanelLayout.Toggle label="Toggle tables panel" />
        </SidePanelLayout.Content>
      </SidePanelLayout>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle tables panel" }));

    expect(panel.collapse).toHaveBeenCalledOnce();
    expect(screen.getByTestId("resize-handle")).toBeTruthy();
  });

  it("expands a collapsed panel", () => {
    panel.isCollapsed.mockReturnValue(true);

    render(
      <SidePanelLayout>
        <SidePanelLayout.Panel>Panel</SidePanelLayout.Panel>
        <SidePanelLayout.Content>
          <SidePanelLayout.Toggle label="Toggle tables panel" />
        </SidePanelLayout.Content>
      </SidePanelLayout>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle tables panel" }));

    expect(panel.expand).toHaveBeenCalledOnce();
  });
});
