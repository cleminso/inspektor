import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { ConnectionsView } from "./view";

let connections: Array<{ id: string }> = [];

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/components/providers/inspectorSessionProvider", () => ({
  useInspectorSessionContext: () => ({ connections }),
}));

vi.mock("./connectionList", () => ({
  ConnectionList: () => <div>Connection list</div>,
}));

afterEach(() => {
  cleanup();
  connections = [];
});

describe("ConnectionsView", () => {
  it("hides the recent connections section when there are no saved connections", () => {
    render(<ConnectionsView />);

    expect(screen.queryByRole("heading", { name: /recent connections/i })).toBeNull();
  });

  it("shows the recent connections section when a saved connection exists", () => {
    connections = [{ id: "connection-1" }];

    render(<ConnectionsView />);

    expect(screen.getByRole("heading", { name: /recent connections/i })).toBeTruthy();
    expect(screen.getByText("Connection list")).toBeTruthy();
  });
});
