import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RelationCellLink } from "@tables/grid/relationCellLink";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@app/providers/inspectorProvider", () => ({
  useInspector: () => ({
    currentBranch: "main",
    currentConnectionId: "connection-1",
    currentSchemaHash: "schema-1",
  }),
}));

afterEach(cleanup);

describe("RelationCellLink", () => {
  it("renders the stored ID with a trailing arrow and keeps relation navigation", () => {
    render(<RelationCellLink relationTable="accounts" relationId="account_0123456789" />);

    const link = screen.getByRole("link", { name: "account_0123456789" });
    expect(link.getAttribute("href")).toBe(
      "/conn/$connectionId/tables/$tableName",
    );
    expect(link.querySelector('[data-slot="text-link-trailing-icon"]')).toBeTruthy();
    expect(link.getAttribute("title")).toBeNull();
  });
});
