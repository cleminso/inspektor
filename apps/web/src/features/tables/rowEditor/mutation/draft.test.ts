import type { ColumnDescriptor } from "jazz-tools";
import { describe, expect, it } from "vitest";

import {
  buildRowMutationSubmission,
  createInsertRowDraft,
  createUpdateRowDraft,
  getMutationFieldInput,
  isRowMutationDraftDirty,
  reconcileRowMutationSource,
  setMutationFieldMode,
  setMutationFieldText,
} from "@tables/rowEditor/mutation/draft";

const columns = [
  { name: "name", column_type: { type: "Text" }, nullable: false },
  { name: "count", column_type: { type: "Integer" }, nullable: false },
  { name: "settings", column_type: { type: "Json" }, nullable: true },
] satisfies ColumnDescriptor[];

describe("update row drafts", () => {
  it("builds a patch from dirty fields only", () => {
    const source = { id: "row-1", name: "Ada", count: 1, settings: null };
    const draft = setMutationFieldText(createUpdateRowDraft(source), columns[0], "Grace");

    expect(buildRowMutationSubmission(draft, columns)).toEqual({
      errors: {},
      values: { name: "Grace" },
    });
    expect(isRowMutationDraftDirty(draft, columns)).toBe(true);
  });

  it("reflects live changes for untouched fields without adding them to the patch", () => {
    const source = { id: "row-1", name: "Ada", count: 1, settings: null };
    const draft = setMutationFieldText(createUpdateRowDraft(source), columns[0], "Grace");
    const reconciled = reconcileRowMutationSource(
      draft,
      { id: "row-1", name: "Ada", count: 2, settings: null },
      columns,
    );

    expect(getMutationFieldInput(reconciled, columns[1])).toEqual({
      mode: "value",
      text: "2",
    });
    expect(buildRowMutationSubmission(reconciled, columns)).toEqual({
      errors: {},
      values: { name: "Grace" },
    });
  });

  it("preserves a dirty field when its live source changes", () => {
    const source = { id: "row-1", name: "Ada", count: 1, settings: null };
    const draft = setMutationFieldText(createUpdateRowDraft(source), columns[0], "Grace");
    const reconciled = reconcileRowMutationSource(
      draft,
      { id: "row-1", name: "Katherine", count: 1, settings: null },
      columns,
    );

    expect(getMutationFieldInput(reconciled, columns[0])).toEqual({
      mode: "value",
      text: "Grace",
    });
    expect(buildRowMutationSubmission(reconciled, columns).values).toEqual({ name: "Grace" });
  });

  it("removes a dirty field when the latest source becomes semantically equal", () => {
    const source = { id: "row-1", name: "Ada", count: 1, settings: { enabled: true } };
    const draft = setMutationFieldText(
      createUpdateRowDraft(source),
      columns[2],
      '{"enabled":false}',
    );
    const reconciled = reconcileRowMutationSource(
      draft,
      { id: "row-1", name: "Ada", count: 1, settings: { enabled: false } },
      columns,
    );

    expect(buildRowMutationSubmission(reconciled, columns)).toEqual({ errors: {}, values: {} });
    expect(getMutationFieldInput(reconciled, columns[2])).toEqual({
      mode: "value",
      text: ["{", '  "enabled": false', "}"].join("\n"),
    });
  });

  it("retains invalid raw input and excludes it from the patch", () => {
    const source = { id: "row-1", name: "Ada", count: 1, settings: null };
    const draft = setMutationFieldText(createUpdateRowDraft(source), columns[1], "one");

    expect(getMutationFieldInput(draft, columns[1])).toEqual({ mode: "value", text: "one" });
    expect(buildRowMutationSubmission(draft, columns)).toEqual({
      errors: { count: "Value must be an integer." },
      values: {},
    });
  });

  it("removes dirty overlays for columns removed from the live schema", () => {
    const source = { id: "row-1", name: "Ada", count: 1, settings: null };
    const draft = setMutationFieldText(createUpdateRowDraft(source), columns[0], "Grace");
    const remainingColumns = columns.filter((column) => column.name !== "name");

    const reconciled = reconcileRowMutationSource(
      draft,
      { id: "row-1", count: 1, settings: null },
      remainingColumns,
    );

    expect(isRowMutationDraftDirty(reconciled, remainingColumns)).toBe(false);
    expect(buildRowMutationSubmission(reconciled, remainingColumns)).toEqual({
      errors: {},
      values: {},
    });
  });

  it("uses nested schema semantics when returning an array field to its source value", () => {
    const timestampArrayColumn = {
      name: "events",
      column_type: { type: "Array", element: { type: "Timestamp" } },
      nullable: false,
    } satisfies ColumnDescriptor;
    const draft = setMutationFieldText(
      createUpdateRowDraft({ events: [new Date("2024-01-02T03:04:05.000Z")] }),
      timestampArrayColumn,
      '["2024-01-02T03:04:05.000Z"]',
    );

    expect(buildRowMutationSubmission(draft, [timestampArrayColumn])).toEqual({
      errors: {},
      values: {},
    });
  });

  it("retains structured text urgently and resolves semantic equality at submission", () => {
    const settingsColumn = columns[2];
    const draft = setMutationFieldText(
      createUpdateRowDraft({ settings: { enabled: true } }),
      settingsColumn,
      '{"enabled":true}',
    );

    expect(draft.fieldInputs.settings).toEqual({
      mode: "value",
      text: '{"enabled":true}',
    });
    expect(buildRowMutationSubmission(draft, [settingsColumn])).toEqual({
      errors: {},
      values: {},
    });
  });

  it("uses canonical BigInt equality when returning a field to its source value", () => {
    const bigintColumn = {
      name: "sequence",
      column_type: { type: "BigInt" },
      nullable: false,
    } satisfies ColumnDescriptor;
    const draft = setMutationFieldText(
      createUpdateRowDraft({ sequence: "1" }),
      bigintColumn,
      "001",
    );

    expect(buildRowMutationSubmission(draft, [bigintColumn])).toEqual({
      errors: {},
      values: {},
    });
    expect(isRowMutationDraftDirty(draft, [bigintColumn])).toBe(false);
  });
});

describe("insert row drafts", () => {
  const insertColumns = [
    { name: "name", column_type: { type: "Text" }, nullable: false },
    {
      name: "status",
      column_type: { type: "Enum", variants: ["active", "archived"] },
      nullable: false,
      default: { type: "Text", value: "active" },
    },
    { name: "note", column_type: { type: "Text" }, nullable: true },
    { name: "payload", column_type: { type: "Bytea" }, nullable: false },
  ] satisfies ColumnDescriptor[];

  it("omits default-backed fields and keeps nullable fields explicitly null", () => {
    const draft = createInsertRowDraft({ name: "Ada", payload: new Uint8Array() }, insertColumns);

    expect(getMutationFieldInput(draft, insertColumns[1])).toEqual({
      mode: "omitted",
      text: "active",
    });
    expect(buildRowMutationSubmission(draft, insertColumns)).toEqual({
      errors: {},
      values: { name: "Ada", note: null, payload: new Uint8Array() },
    });
  });

  it("allows a default-backed field to be explicitly set to null or a value", () => {
    const nullableDefaultColumn = {
      name: "status",
      column_type: { type: "Text" },
      nullable: true,
      default: { type: "Text", value: "active" },
    } satisfies ColumnDescriptor;
    const initialDraft = createInsertRowDraft({}, [nullableDefaultColumn]);
    const nullDraft = setMutationFieldMode(initialDraft, nullableDefaultColumn, "null");
    const valueDraft = setMutationFieldText(initialDraft, nullableDefaultColumn, "archived");

    expect(buildRowMutationSubmission(nullDraft, [nullableDefaultColumn]).values).toEqual({
      status: null,
    });
    expect(buildRowMutationSubmission(valueDraft, [nullableDefaultColumn]).values).toEqual({
      status: "archived",
    });
    expect(isRowMutationDraftDirty(initialDraft, [nullableDefaultColumn])).toBe(false);
    expect(isRowMutationDraftDirty(nullDraft, [nullableDefaultColumn])).toBe(true);
  });

  it("returns restored NULL and DEFAULT fields to a clean insert draft", () => {
    const nullableColumn = insertColumns[2];
    const defaultColumn = insertColumns[1];
    const initialDraft = createInsertRowDraft({}, [nullableColumn, defaultColumn]);
    const restoredNullDraft = setMutationFieldMode(
      setMutationFieldText(initialDraft, nullableColumn, "draft note"),
      nullableColumn,
      "null",
    );
    const restoredDefaultDraft = setMutationFieldMode(
      setMutationFieldText(restoredNullDraft, defaultColumn, "archived"),
      defaultColumn,
      "omitted",
    );

    expect(isRowMutationDraftDirty(restoredNullDraft, [nullableColumn, defaultColumn])).toBe(false);
    expect(isRowMutationDraftDirty(restoredDefaultDraft, [nullableColumn, defaultColumn])).toBe(
      false,
    );
  });

  it("reports required omitted values that have no default", () => {
    const nameColumn = insertColumns[0];
    const draft = setMutationFieldMode(
      createInsertRowDraft({}, [nameColumn]),
      nameColumn,
      "omitted",
    );

    expect(buildRowMutationSubmission(draft, [nameColumn])).toEqual({
      errors: { name: "This column cannot be omitted." },
      values: {},
    });
  });

  it("rejects required read-only binary fields instead of inventing an empty value", () => {
    const payloadColumn = insertColumns[3];
    const draft = createInsertRowDraft({}, [payloadColumn]);

    expect(buildRowMutationSubmission(draft, [payloadColumn])).toEqual({
      errors: { payload: "This read-only column requires a value." },
      values: {},
    });
  });

  it("initializes newly discovered insert columns without replacing existing field drafts", () => {
    const nameColumn = insertColumns[0];
    const initialDraft = setMutationFieldText(
      createInsertRowDraft({}, [nameColumn]),
      nameColumn,
      "Ada",
    );
    const reconciledDraft = reconcileRowMutationSource(initialDraft, {}, insertColumns);

    expect(getMutationFieldInput(reconciledDraft, nameColumn)).toEqual({
      mode: "value",
      text: "Ada",
    });
    expect(getMutationFieldInput(reconciledDraft, insertColumns[1])).toEqual({
      mode: "omitted",
      text: "active",
    });
    expect(getMutationFieldInput(reconciledDraft, insertColumns[3])).toEqual({
      mode: "value",
      text: "",
    });
  });

  it("adopts a changed insert default when the field has not been edited", () => {
    const nullableColumn = {
      name: "status",
      column_type: { type: "Text" },
      nullable: true,
    } satisfies ColumnDescriptor;
    const defaultColumn = {
      ...nullableColumn,
      default: { type: "Text", value: "active" },
    } satisfies ColumnDescriptor;
    const reconciledDraft = reconcileRowMutationSource(
      createInsertRowDraft({}, [nullableColumn]),
      {},
      [defaultColumn],
    );

    expect(getMutationFieldInput(reconciledDraft, defaultColumn)).toEqual({
      mode: "omitted",
      text: "active",
    });
    expect(isRowMutationDraftDirty(reconciledDraft, [defaultColumn])).toBe(false);
  });

  it("preserves an edited insert value when the column schema changes", () => {
    const nullableColumn = {
      name: "status",
      column_type: { type: "Text" },
      nullable: true,
    } satisfies ColumnDescriptor;
    const defaultColumn = {
      ...nullableColumn,
      default: { type: "Text", value: "active" },
    } satisfies ColumnDescriptor;
    const draft = setMutationFieldText(
      createInsertRowDraft({}, [nullableColumn]),
      nullableColumn,
      "archived",
    );
    const reconciledDraft = reconcileRowMutationSource(draft, {}, [defaultColumn]);

    expect(getMutationFieldInput(reconciledDraft, defaultColumn)).toEqual({
      mode: "value",
      text: "archived",
    });
    expect(isRowMutationDraftDirty(reconciledDraft, [defaultColumn])).toBe(true);
  });
});
