import { useState } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SelectedTableView } from "@/components/table-explorer/selectedTableView";

let mountCount = 0;

vi.mock("@regarde/ui/emptyState", () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/components/providers/inspectorProvider", () => ({
  useInspector: () => ({
    currentBranch: "main",
    currentConnectionId: "connection-1",
    currentSchemaHash: "schema-1",
    runtime: { wasmSchema: {} },
  }),
}));

vi.mock("@/hooks/useTableExplorerSearchParams", () => ({
  useTableExplorerSearchParams: () => ({ view: "data" }),
}));

vi.mock("@/components/table-explorer/data/view", () => ({
  DataView: ({ tableName }: { tableName: string }) => {
    const [mountId] = useState(() => ++mountCount);
    return <div>{`${tableName}:${mountId}`}</div>;
  },
}));

vi.mock("@/components/table-explorer/schema/view", () => ({
  SchemaView: () => null,
}));

describe("SelectedTableView", () => {
  it("remounts table-scoped data state when the table changes", () => {
    mountCount = 0;
    const { rerender } = render(<SelectedTableView tableName="accounts" />);
    expect(screen.getByText("accounts:1")).not.toBeNull();

    rerender(<SelectedTableView tableName="users" />);

    expect(screen.getByText("users:2")).not.toBeNull();
  });
});
