import { describe, expect, it } from "vitest";

import { updateCellSelection } from "@tables/grid/cellSelection";

describe("updateCellSelection", () => {
  it("replaces the selection with an unmodified target", () => {
    const result = updateCellSelection({
      anchorCell: { columnId: "name", rowId: "row-1" },
      columnIds: ["name", "role"],
      mode: "replace",
      rowIds: ["row-1", "row-2"],
      selectedCells: [{ columnId: "name", rowId: "row-1" }],
      target: { columnId: "role", rowId: "row-2" },
    });

    expect(result).toEqual({
      activeCell: { columnId: "role", rowId: "row-2" },
      anchorCell: { columnId: "role", rowId: "row-2" },
      selectedCells: [{ columnId: "role", rowId: "row-2" }],
    });
  });

  it("toggles an additive target without discarding other cells", () => {
    const result = updateCellSelection({
      anchorCell: { columnId: "name", rowId: "row-1" },
      columnIds: ["name", "role"],
      mode: "additive",
      rowIds: ["row-1", "row-2"],
      selectedCells: [{ columnId: "name", rowId: "row-1" }],
      target: { columnId: "role", rowId: "row-2" },
    });

    expect(result.selectedCells).toEqual([
      { columnId: "name", rowId: "row-1" },
      { columnId: "role", rowId: "row-2" },
    ]);
    expect(result.activeCell).toEqual({ columnId: "role", rowId: "row-2" });
    expect(result.anchorCell).toEqual({ columnId: "name", rowId: "row-1" });
  });

  it("selects the rectangular range between the anchor and Shift target", () => {
    const result = updateCellSelection({
      anchorCell: { columnId: "name", rowId: "row-1" },
      columnIds: ["name", "role", "team"],
      mode: "range",
      rowIds: ["row-1", "row-2", "row-3"],
      selectedCells: [{ columnId: "name", rowId: "row-1" }],
      target: { columnId: "role", rowId: "row-2" },
    });

    expect(result.selectedCells).toEqual([
      { columnId: "name", rowId: "row-1" },
      { columnId: "role", rowId: "row-1" },
      { columnId: "name", rowId: "row-2" },
      { columnId: "role", rowId: "row-2" },
    ]);
    expect(result.activeCell).toEqual({ columnId: "role", rowId: "row-2" });
  });
});
