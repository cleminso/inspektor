import { describe, expect, it } from "vitest";

import {
  getNearestSelectedRowId,
  updateRowSelection,
} from "@/components/table-explorer/data/rowSelection";

const rowIds = ["row-1", "row-2", "row-3", "row-4"];

describe("updateRowSelection", () => {
  it("adds individually checked rows and moves the range anchor", () => {
    expect(
      updateRowSelection({
        anchorRowId: "row-1",
        checked: true,
        rowIds,
        selectedRowIds: ["row-1"],
        shiftKey: false,
        targetRowId: "row-3",
      }),
    ).toEqual({
      anchorRowId: "row-3",
      selectedRowIds: ["row-1", "row-3"],
    });
  });

  it("checks the inclusive visible range and preserves its anchor", () => {
    expect(
      updateRowSelection({
        anchorRowId: "row-1",
        checked: true,
        rowIds,
        selectedRowIds: ["row-1"],
        shiftKey: true,
        targetRowId: "row-3",
      }),
    ).toEqual({
      anchorRowId: "row-1",
      selectedRowIds: ["row-1", "row-2", "row-3"],
    });
  });

  it("unchecks the inclusive visible range", () => {
    expect(
      updateRowSelection({
        anchorRowId: "row-2",
        checked: false,
        rowIds,
        selectedRowIds: rowIds,
        shiftKey: true,
        targetRowId: "row-4",
      }),
    ).toEqual({
      anchorRowId: "row-2",
      selectedRowIds: ["row-1"],
    });
  });
});

describe("getNearestSelectedRowId", () => {
  it("chooses the nearest remaining row after the focused row is removed", () => {
    expect(getNearestSelectedRowId(rowIds, ["row-1", "row-2", "row-4"], "row-3")).toBe(
      "row-2",
    );
  });
});
