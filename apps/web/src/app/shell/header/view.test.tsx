import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InspectorHeader } from "./view";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useMatchRoute: () => ({ to }: { to: string }) => to.endsWith("/tables"),
  useNavigate: () => navigate,
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

vi.mock("@app/providers/inspectorProvider", () => ({
  useInspector: () => ({
    currentBranch: "main",
    currentConnectionId: "connection-1",
    currentSchemaHash: "schema-1",
  }),
}));

vi.mock("@app/shell/header/branchSwitcher", () => ({
  BranchSwitcher: () => <button type="button">main</button>,
}));

vi.mock("@shared/connections/connectionSwitcher", () => ({
  ConnectionSwitcher: () => <button type="button">connection-1</button>,
}));

vi.mock("@app/shell/header/schemaSwitcher", () => ({
  SchemaSwitcher: () => <button type="button">schema-1</button>,
}));

afterEach(cleanup);

describe("InspectorHeader", () => {
  it("contains context switchers and the primary Inspector navigation", () => {
    render(<InspectorHeader />);

    expect(screen.getByRole("button", { name: "connection-1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "main" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "schema-1" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Inspector navigation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tables" }).getAttribute("aria-current")).toBe(
      "page",
    );
    fireEvent.click(screen.getByRole("button", { name: "Subscriptions" }));

    expect(navigate).toHaveBeenCalledWith({
      to: "/conn/$connectionId/queries",
      params: {
        connectionId: "connection-1",
      },
    });
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeTruthy();
  });
});
