import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CellInspectorSidePanel } from "@/components/table-explorer/data/cellInspectorSidePanel";

vi.mock("@/components/providers/inspectorProvider", () => ({
  useInspector: () => ({
    currentBranch: "main",
    currentConnectionId: "connection-1",
    currentSchemaHash: "schema-1",
  }),
}));

afterEach(cleanup);

describe("CellInspectorSidePanel", () => {
  it("renders the opened cell value without edit-form controls", () => {
    const { rerender } = render(
      <CellInspectorSidePanel
        columnPosition={0}
        rowPosition={0}
        rowValues={{ id: "row-1" }}
        schemaColumns={[]}
        target={{ columnId: "id", rowId: "row-1" }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByRole("heading", { name: "Cell 1:1" })).toBeTruthy();
    expect(screen.queryByText("Row row-1")).toBeNull();
    expect(screen.getByText("row-1")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();

    rerender(
      <CellInspectorSidePanel
        columnPosition={0}
        rowPosition={1}
        rowValues={{ id: "row-2" }}
        schemaColumns={[]}
        target={{ columnId: "id", rowId: "row-2" }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText("row-2")).toBeTruthy();
  });

  it("renders live value changes for the same cell", () => {
    const nameColumn = {
      column_type: { type: "Text" },
      name: "name",
      nullable: false,
    } as never;
    const { rerender } = render(
      <CellInspectorSidePanel
        columnPosition={0}
        rowPosition={0}
        rowValues={{ id: "row-1", name: "Ada" }}
        schemaColumns={[nameColumn]}
        target={{ columnId: "name", rowId: "row-1" }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText("Ada")).toBeTruthy();

    rerender(
      <CellInspectorSidePanel
        columnPosition={0}
        rowPosition={0}
        rowValues={{ id: "row-1", name: "Grace" }}
        schemaColumns={[nameColumn]}
        target={{ columnId: "name", rowId: "row-1" }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText("Grace")).toBeTruthy();
    expect(screen.queryByText("Ada")).toBeNull();
  });
});
