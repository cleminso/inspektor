import type { ColumnDescriptor } from "jazz-tools";
import { describe, expect, it } from "vitest";

import { getColumnTypeMarker } from "@/components/table-explorer/data/columnTypeMarker";
import type { TableColumnMeta } from "@/types/tableExplorer";

function createColumn(
  column: Pick<ColumnDescriptor, "column_type" | "nullable"> &
    Partial<Pick<ColumnDescriptor, "references">>,
): TableColumnMeta {
  return {
    accessorKey: "value",
    column: { name: "value", ...column } as ColumnDescriptor,
    id: "value",
    isSortable: false,
    label: "Value",
  };
}

describe("getColumnTypeMarker", () => {
  it("distinguishes the synthetic Jazz row ID from stored UUID values", () => {
    expect(
      getColumnTypeMarker({
        accessorKey: "id",
        column: null,
        id: "id",
        isSortable: true,
        label: "id",
      }),
    ).toEqual({ icon: "key", label: "Row ID", suffix: "" });
    expect(
      getColumnTypeMarker(createColumn({ column_type: { type: "Uuid" }, nullable: false })),
    ).toEqual({ icon: null, label: "UUID", suffix: "ID" });
  });

  it("keeps array headers compact without nested or optional modifiers", () => {
    expect(
      getColumnTypeMarker(
        createColumn({
          column_type: { type: "Array", element: { type: "Text" } },
          nullable: true,
        }),
      ),
    ).toEqual({ icon: null, label: "Array", suffix: "[ ]" });
  });

  it("uses one relation marker without array or optional modifiers", () => {
    expect(
      getColumnTypeMarker(
        createColumn({
          column_type: { type: "Array", element: { type: "Uuid" } },
          nullable: true,
          references: "accounts",
        }),
      ),
    ).toEqual({
      icon: "relation",
      label: "Reference",
      suffix: "",
    });
  });

  it("distinguishes typed and untyped JSON", () => {
    expect(
      getColumnTypeMarker(createColumn({ column_type: { type: "Json" }, nullable: false })),
    ).toMatchObject({ label: "JSON", suffix: "{ }" });
    expect(
      getColumnTypeMarker(
        createColumn({ column_type: { type: "Json", schema: {} }, nullable: false }),
      ),
    ).toMatchObject({ label: "Typed JSON", suffix: "{T}" });
  });
});
