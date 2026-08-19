import { describe, expect, it } from "vitest";
import type { ColumnDescriptor } from "jazz-tools";

import {
  filterTableFilterClauses,
  parseFiltersFromSearchParam,
  parseFilterTokens,
  serializeFiltersToSearchParam,
  tokenizePastedFilterValues,
} from "./filterParsing";

const integerColumn = { name: "age", column_type: { type: "Integer" }, nullable: false } as ColumnDescriptor;
const exposedColumns = [
  [{ type: "Text" }, " Ada ", "Ada"],
  [{ type: "Uuid" }, " user-1 ", "user-1"],
  [{ type: "BigInt" }, "9007199254740993", "9007199254740993"],
  [{ type: "Double" }, "1.5", 1.5],
  [{ type: "Timestamp" }, "2024-01-01T00:00:00.000Z", 1704067200000],
  [{ type: "Boolean" }, "true", true],
  [{ type: "Enum", variants: ["active", "paused"] }, "active", "active"],
] as const;

describe("scalar in token parsing", () => {
  it("accepts line-separated paste without splitting commas inside a token", () => {
    expect(tokenizePastedFilterValues("1\n2\r\n3,4")).toEqual(["1", "2", "3,4"]);
  });

  it("parses every token through the selected column schema", () => {
    expect(parseFilterTokens(integerColumn, ["1", " 2 "])).toEqual([1, 2]);
    expect(() => parseFilterTokens(integerColumn, ["1", "two"])).toThrow(
      "Integer values must be integers.",
    );
  });

  it.each(exposedColumns)("parses exposed %s scalar tokens", (columnType, input, expected) => {
    const column = { name: "value", column_type: columnType, nullable: false } as ColumnDescriptor;
    expect(parseFilterTokens(column, [input])).toEqual([expected]);
  });

  it("rejects fractional Integer tokens and invalid Timestamp tokens", () => {
    const timestampColumn = {
      name: "createdAt",
      column_type: { type: "Timestamp" },
      nullable: false,
    } as ColumnDescriptor;
    expect(() => parseFilterTokens(integerColumn, ["1.5"])).toThrow("integers");
    expect(() => parseFilterTokens(timestampColumn, ["not-a-date"])).toThrow("timestamp");
  });

  it("excludes invalid values and normalizes valid values for query execution", () => {
    const schema = {
      people: { columns: [integerColumn] },
    } as never;
    expect(
      filterTableFilterClauses({
        schema,
        tableName: "people",
        filters: [
          { id: "invalid", column: "age", operator: "in", value: [1, "two"] },
          { id: "valid", column: "age", operator: "gt", value: "18" },
        ],
      }),
    ).toEqual([{ id: "valid", column: "age", operator: "gt", value: 18 }]);
  });
});

describe("URL filter state", () => {
  it("round-trips repeated predicates without changing their values", () => {
    const filters = [
      { id: "first", column: "age", operator: "gt" as const, value: 18 },
      { id: "second", column: "age", operator: "gt" as const, value: 18 },
    ];

    expect(parseFiltersFromSearchParam(serializeFiltersToSearchParam(filters))).toEqual(filters);
  });

  it.each([
    "not-json",
    JSON.stringify({ id: "filter" }),
    JSON.stringify([{ column: "age", operator: "gt", value: 18 }]),
    JSON.stringify([{ id: "filter", column: "age", operator: "unknown", value: 18 }]),
    JSON.stringify([{ id: "filter", column: "age", operator: "gt" }]),
  ])("rejects malformed filter state: %s", (value) => {
    expect(parseFiltersFromSearchParam(value)).toEqual([]);
  });
});
