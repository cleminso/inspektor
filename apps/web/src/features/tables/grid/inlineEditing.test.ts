import type { ColumnDescriptor } from "jazz-tools";
import { describe, expect, it } from "vitest";

import {
  getInlineFieldRoute,
  resolveSpreadsheetCompletionTarget,
} from "@tables/grid/inlineEditing";
import type { TableColumnMeta } from "@tables/tableTypes";

function columnMeta(column: ColumnDescriptor | null): TableColumnMeta {
  return {
    accessorKey: column?.name ?? "id",
    column,
    id: column?.name ?? "id",
    isSortable: true,
    label: column?.name ?? "ID",
  };
}

describe("getInlineFieldRoute", () => {
  it("opens scalar columns in the Floating widget", () => {
    expect(
      getInlineFieldRoute(
        columnMeta({ name: "count", column_type: { type: "Integer" }, nullable: false }),
      ),
    ).toBe("scalar");
  });

  it("routes relation and binary fields to the complete-row pane", () => {
    expect(
      getInlineFieldRoute(
        columnMeta({
          name: "accountId",
          column_type: { type: "Uuid" },
          nullable: false,
          references: "accounts",
        }),
      ),
    ).toBe("rowPane");
    expect(
      getInlineFieldRoute(
        columnMeta({ name: "payload", column_type: { type: "Bytea" }, nullable: false }),
      ),
    ).toBe("rowPane");
  });

  it("defers structured fields and rejects synthetic columns", () => {
    expect(
      getInlineFieldRoute(
        columnMeta({ name: "settings", column_type: { type: "Json" }, nullable: false }),
      ),
    ).toBe("structured");
    expect(getInlineFieldRoute(columnMeta(null))).toBe("readOnly");
  });
});

describe("resolveSpreadsheetCompletionTarget", () => {
  const rows = [
    [
      { rowId: "row-1", columnId: "name" },
      { rowId: "row-1", columnId: "role" },
    ],
    [
      { rowId: "row-2", columnId: "name" },
      { rowId: "row-2", columnId: "role" },
    ],
  ];

  it("moves Enter down in the same column", () => {
    expect(
      resolveSpreadsheetCompletionTarget(rows, { rowId: "row-1", columnId: "role" }, "enter"),
    ).toEqual({ rowId: "row-2", columnId: "role" });
  });

  it("wraps Tab and Shift+Tab across rows", () => {
    expect(
      resolveSpreadsheetCompletionTarget(
        rows,
        { rowId: "row-1", columnId: "role" },
        "tabForward",
      ),
    ).toEqual({ rowId: "row-2", columnId: "name" });
    expect(
      resolveSpreadsheetCompletionTarget(
        rows,
        { rowId: "row-2", columnId: "name" },
        "tabBackward",
      ),
    ).toEqual({ rowId: "row-1", columnId: "role" });
  });

  it("keeps focus at table boundaries", () => {
    expect(
      resolveSpreadsheetCompletionTarget(rows, { rowId: "row-2", columnId: "role" }, "enter"),
    ).toEqual({ rowId: "row-2", columnId: "role" });
    expect(
      resolveSpreadsheetCompletionTarget(
        rows,
        { rowId: "row-1", columnId: "name" },
        "tabBackward",
      ),
    ).toEqual({ rowId: "row-1", columnId: "name" });
  });
});
