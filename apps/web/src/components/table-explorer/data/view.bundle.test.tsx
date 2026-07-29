import { describe, expect, it, vi } from "vitest";

const rowEditorModuleLoaded = vi.hoisted(() => vi.fn());
const codeMirrorModuleLoaded = vi.hoisted(() => vi.fn());
const tableFilterModuleLoaded = vi.hoisted(() => vi.fn());

vi.mock("@codemirror/view", () => {
  codeMirrorModuleLoaded();

  return {};
});

vi.mock("@/components/table-explorer/data/editRowForm", () => {
  rowEditorModuleLoaded();

  return { EditRowForm: vi.fn() };
});

vi.mock("@/components/table-explorer/data/insertRowForm", () => {
  rowEditorModuleLoaded();

  return { InsertRowForm: vi.fn() };
});

vi.mock("@/components/table-explorer/data/tableFilter", () => {
  tableFilterModuleLoaded();

  return { TableFilter: vi.fn() };
});

import "./view";

describe("DataView module boundary", () => {
  it("does not initialize row-editor forms when the table view is imported", () => {
    expect(rowEditorModuleLoaded).not.toHaveBeenCalled();
  });

  it("does not initialize CodeMirror when the base table view is imported", () => {
    expect(codeMirrorModuleLoaded).not.toHaveBeenCalled();
  });

  it("does not initialize the retired table-filter UI when the table view is imported", () => {
    expect(tableFilterModuleLoaded).not.toHaveBeenCalled();
  });
});
