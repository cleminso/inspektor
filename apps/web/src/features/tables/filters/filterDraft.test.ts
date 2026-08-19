import { describe, expect, it } from "vitest";
import type { ColumnDescriptor } from "jazz-tools";

import {
  applyFilterDraft,
  backspaceFilterDraft,
  createFilterDraft,
  editFilterDraft,
  selectFilterColumn,
  selectFilterOperator,
  setFilterDraftValue,
} from "./filterDraft";
import type { TableFilterClause } from "./tableFilters";

const nameColumn = { name: "name", column_type: { type: "Text" }, nullable: false } as ColumnDescriptor;
const ageColumn = { name: "age", column_type: { type: "Integer" }, nullable: false } as ColumnDescriptor;

describe("filter draft transitions", () => {
  it("creates at column and resets dependent values when the column changes", () => {
    const draft = setFilterDraftValue(
      selectFilterOperator(selectFilterColumn(createFilterDraft(), nameColumn), "eq"),
      "Ada",
    );

    expect(selectFilterColumn(draft, ageColumn)).toMatchObject({
      stage: "operator",
      column: ageColumn,
      operator: null,
      rawValue: "",
      tokens: [],
    });
  });

  it("resets only the value when the operator changes", () => {
    const draft = setFilterDraftValue(
      selectFilterOperator(selectFilterColumn(createFilterDraft(), nameColumn), "eq"),
      "Ada",
    );

    expect(selectFilterOperator(draft, "ne")).toMatchObject({
      column: nameColumn,
      operator: "ne",
      rawValue: "",
      stage: "value",
    });
  });

  it("enters editing at the activated stage and atomically preserves clause order", () => {
    const filters: TableFilterClause[] = [
      { id: "first", column: "name", operator: "eq", value: "Ada" },
      { id: "second", column: "age", operator: "gt", value: 20 },
    ];
    const draft = setFilterDraftValue(
      editFilterDraft(filters[0], 0, "value", nameColumn),
      "Grace",
    );

    expect(applyFilterDraft(draft, filters)).toEqual({
      filters: [
        { id: "first", column: "name", operator: "eq", value: "Grace" },
        filters[1],
      ],
    });
  });

  it("follows a unique clause ID when another filter shifts its original index", () => {
    const original: TableFilterClause = { id: "second", column: "name", operator: "eq", value: "Ada" };
    const draft = setFilterDraftValue(editFilterDraft(original, 1, "value", nameColumn), "Grace");

    expect(applyFilterDraft(draft, [original])).toEqual({
      filters: [{ id: "second", column: "name", operator: "eq", value: "Grace" }],
    });
  });

  it("rejects an ambiguous edit when legacy clause IDs collide", () => {
    const original: TableFilterClause = { id: "duplicate", column: "name", operator: "eq", value: "Ada" };
    const draft = setFilterDraftValue(editFilterDraft(original, 2, "value", nameColumn), "Grace");

    expect(applyFilterDraft(draft, [original, { ...original }])).toEqual({
      issue: "The filter is no longer available.",
    });
  });

  it("rejects incomplete or invalid drafts without changing applied clauses", () => {
    const filters: TableFilterClause[] = [{ id: "first", column: "name", operator: "eq", value: "Ada" }];
    const incomplete = selectFilterColumn(createFilterDraft(), nameColumn);
    const invalid = setFilterDraftValue(selectFilterOperator(incomplete, "eq"), "");

    expect(applyFilterDraft(incomplete, filters)).toEqual({ issue: "Choose an operator." });
    expect(applyFilterDraft(invalid, filters)).toEqual({ issue: "Value is required." });
    expect(filters[0]?.value).toBe("Ada");
  });

  it("removes a complete draft on Backspace and clears incomplete fields one stage at a time", () => {
    const complete = setFilterDraftValue(
      selectFilterOperator(selectFilterColumn(createFilterDraft(), nameColumn), "eq"),
      "Ada",
    );
    expect(backspaceFilterDraft(complete)).toEqual({ action: "remove" });

    const withoutValue = backspaceFilterDraft({ ...complete, rawValue: "" });
    expect(withoutValue).toMatchObject({ action: "update", draft: { operator: null, stage: "operator" } });
    expect(backspaceFilterDraft(withoutValue.action === "update" ? withoutValue.draft : complete)).toMatchObject({
      action: "update",
      draft: { column: null, stage: "column" },
    });
  });
});
