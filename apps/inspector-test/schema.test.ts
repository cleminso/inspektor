import { describe, expect, it } from "vitest";

import { app } from "./schema.js";

describe("Inspector Test schema", () => {
  it("covers focused Inspector scenarios", () => {
    expect(new Set(Object.keys(app.wasmSchema))).toEqual(
      new Set([
        "projects",
        "columnTypeShowcase",
        "contentEdgeCases",
        "creatorManagedRecords",
        "emptyRecords",
        "paginationRecords",
        "publicEditableRecords",
        "publicReadOnlyRecords",
        "relationParents",
        "relationChildren",
        "todos",
        "wideRecords",
      ]),
    );
  });

  it("preserves optional and relation column metadata", () => {
    const columns = app.wasmSchema.relationChildren.columns;

    expect(columns).toEqual([
      expect.objectContaining({ name: "label", nullable: false }),
      expect.objectContaining({ name: "requiredParentId", nullable: false, references: "relationParents" }),
      expect.objectContaining({ name: "optionalParentId", nullable: true, references: "relationParents" }),
    ]);
  });

  it("covers every supported scalar and collection type", () => {
    const columnTypes = app.wasmSchema.columnTypeShowcase.columns.map((column) => column.column_type.type);

    expect(new Set(columnTypes)).toEqual(
      new Set(["Text", "Boolean", "Integer", "Double", "Timestamp", "Enum", "Json", "Array", "Bytea", "Uuid"]),
    );
  });
});
