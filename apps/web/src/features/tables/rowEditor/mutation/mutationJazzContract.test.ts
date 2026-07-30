import { describe, expect, it } from "vitest";
import { toValue, unwrapValue, type ColumnDescriptor } from "jazz-tools";

import {
  buildRowMutationSubmission,
  createUpdateRowDraft,
  setMutationFieldMode,
  setMutationFieldText,
} from "@tables/rowEditor/mutation/draft";

function column(
  name: string,
  columnType: ColumnDescriptor["column_type"],
  nullable = false,
): ColumnDescriptor {
  return { name, column_type: columnType, nullable };
}

describe("row mutation Jazz boundary", () => {
  it.each([
    ['"hello"', "hello"],
    ['{"enabled":true}', { enabled: true }],
    ["42", 42],
    ["true", true],
  ] as const)("round-trips JSON input %s through Jazz", (input, expected) => {
    const jsonColumn = column("payload", { type: "Json" });
    const draft = setMutationFieldText(
      createUpdateRowDraft({ payload: { previous: true } }),
      jsonColumn,
      input,
    );
    const submission = buildRowMutationSubmission(draft, [jsonColumn]);

    const jazzValue = toValue(submission.values.payload, jsonColumn.column_type);

    expect(submission.errors).toEqual({});
    expect(unwrapValue(jazzValue, jsonColumn.column_type)).toEqual(expected);
  });

  it("round-trips nested JSON values through Jazz", () => {
    const jsonArrayColumn = column("items", { type: "Array", element: { type: "Json" } });
    const draft = setMutationFieldText(
      createUpdateRowDraft({ items: [] }),
      jsonArrayColumn,
      '["hello",{"enabled":true},42,true]',
    );
    const submission = buildRowMutationSubmission(draft, [jsonArrayColumn]);

    const jazzValue = toValue(submission.values.items, jsonArrayColumn.column_type);

    expect(submission.errors).toEqual({});
    expect(unwrapValue(jazzValue, jsonArrayColumn.column_type)).toEqual([
      "hello",
      { enabled: true },
      42,
      true,
    ]);
  });

  it("keeps SQL NULL separate from JSON input", () => {
    const jsonColumn = column("payload", { type: "Json" }, true);
    const draft = setMutationFieldMode(
      createUpdateRowDraft({ payload: { previous: true } }),
      jsonColumn,
      "null",
    );
    const submission = buildRowMutationSubmission(draft, [jsonColumn]);

    expect(toValue(submission.values.payload, jsonColumn.column_type)).toEqual({ type: "Null" });
  });

  it("preserves a safe BigInt through the installed Jazz converter", () => {
    const bigIntColumn = column("sequence", { type: "BigInt" });
    const draft = setMutationFieldText(
      createUpdateRowDraft({ sequence: 1 }),
      bigIntColumn,
      String(Number.MAX_SAFE_INTEGER),
    );
    const submission = buildRowMutationSubmission(draft, [bigIntColumn]);

    expect(toValue(submission.values.sequence, bigIntColumn.column_type)).toEqual({
      type: "BigInt",
      value: Number.MAX_SAFE_INTEGER,
    });
  });
});
