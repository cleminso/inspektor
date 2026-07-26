import { describe, expect, it } from "vitest";
import type { ColumnType } from "jazz-tools";

import { formatMutationFieldValue } from "@/lib/table-explorer/mutationParsing";

describe("formatMutationFieldValue", () => {
  it.each([
    [{ type: "Json" }, { enabled: true }, ["{", '  "enabled": true', "}"].join("\n")],
    [
      { type: "Array", element: { type: "Text" } },
      ["one", "two"],
      ["[", '  "one",', '  "two"', "]"].join("\n"),
    ],
    [{ type: "Row", columns: [] }, { name: "Ada" }, ["{", '  "name": "Ada"', "}"].join("\n")],
  ] satisfies [ColumnType, unknown, string][])(
    "pretty-serializes a runtime $0.type value",
    (type, value, expected) => {
      expect(formatMutationFieldValue(value, type)).toBe(expected);
    },
  );

  it("serializes a JSON string as JSON", () => {
    expect(formatMutationFieldValue("value", { type: "Json" })).toBe('"value"');
  });

  it("does not format ordinary text", () => {
    expect(formatMutationFieldValue('{"enabled":true}', { type: "Text" })).toBe('{"enabled":true}');
  });
});
