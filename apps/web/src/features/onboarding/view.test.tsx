import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { appRoutes } from "@app/routing/appRoutes";

import { ConnectionsView } from "./view";

let connections: Array<{ id: string }> = [];

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@app/providers/inspectorSessionProvider", () => ({
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
  it("renders setup actions as navigation links", () => {
    render(<ConnectionsView />);

    expect(screen.getByRole("link", { name: "Add connection" }).getAttribute("href")).toBe(
      appRoutes.newConnection,
    );
    expect(screen.getByRole("link", { name: "Jazz documentation" }).getAttribute("href")).toBe(
      "https://jazz.tools/docs",
    );
  });

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
