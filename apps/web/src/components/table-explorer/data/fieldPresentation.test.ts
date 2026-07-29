import type { ColumnDescriptor } from "jazz-tools";
import { describe, expect, it } from "vitest";

import { formatColumnTypeLabel, safelySerializeStructuredValue } from "./fieldPresentation";

const jsonColumn = {
  column_type: { type: "Json" },
  name: "details",
  nullable: false,
} satisfies ColumnDescriptor;

describe("safelySerializeStructuredValue", () => {
  it("reads each ordinary structured property once during serialization", () => {
    let getterReads = 0;
    const value = Object.defineProperty({}, "name", {
      enumerable: true,
      get() {
        getterReads += 1;
        return "Ada";
      },
    });

    expect(safelySerializeStructuredValue(value, jsonColumn)).toEqual({
      source: '{\n  "name": "Ada"\n}',
      fallback: null,
    });
    expect(getterReads).toBe(1);
  });

  it("serializes nested binary as a bounded marker while traversing the value once", () => {
    let payloadReads = 0;
    const nested = Object.defineProperty({}, "payload", {
      enumerable: true,
      get() {
        payloadReads += 1;
        return new Uint8Array([0, 1, 2]);
      },
    });
    const presentation = safelySerializeStructuredValue({ nested }, jsonColumn);

    expect(presentation).toEqual({
      source:
        '{\n  "nested": {\n    "payload": {\n      "$type": "bytes",\n      "byteLength": 3\n    }\n  }\n}',
      fallback: null,
    });
    expect(payloadReads).toBe(1);
    expect(presentation.source).not.toContain('"0"');
  });

  it("falls back for an unsupported runtime object", () => {
    expect(safelySerializeStructuredValue(new Map([["name", "Ada"]]), jsonColumn)).toEqual({
      source: null,
      fallback: { $type: "unsupported", valueType: "object" },
    });
  });
});

describe("formatColumnTypeLabel", () => {
  it.each([
    ["Array", "Array"],
    ["BigInt", "BigInt"],
    ["Boolean", "Boolean"],
    ["Bytea", "Binary"],
    ["Double", "Float"],
    ["Enum", "Enum"],
    ["Integer", "Integer"],
    ["Json", "JSON"],
    ["Row", "Row"],
    ["Text", "Text"],
    ["Timestamp", "Timestamp"],
    ["Uuid", "UUID"],
  ] as const)("maps the %s storage type to the %s semantic label", (type, label) => {
    expect(
      formatColumnTypeLabel({
        column_type: { type } as ColumnDescriptor["column_type"],
        name: "value",
        nullable: false,
      }),
    ).toBe(label);
  });

  it("distinguishes typed JSON from untyped JSON", () => {
    expect(
      formatColumnTypeLabel({
        column_type: { type: "Json", schema: { type: "object" } } as never,
        name: "metadata",
        nullable: false,
      }),
    ).toBe("Typed JSON");
  });
});
