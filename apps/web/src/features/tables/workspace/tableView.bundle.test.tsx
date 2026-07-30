import { describe, expect, it, vi } from "vitest";

const rowEditorModuleLoaded = vi.hoisted(() => vi.fn());
const codeMirrorModuleLoaded = vi.hoisted(() => vi.fn());

vi.mock("@codemirror/view", () => {
  codeMirrorModuleLoaded();

  return {};
});

vi.mock("@tables/rowEditor/editForm", () => {
  rowEditorModuleLoaded();

  return { EditRowForm: vi.fn() };
});

vi.mock("@tables/rowEditor/insertForm", () => {
  rowEditorModuleLoaded();

  return { InsertRowForm: vi.fn() };
});

import "./tableView";

describe("TableView module boundary", () => {
  it("does not initialize row-editor forms when the table view is imported", () => {
    expect(rowEditorModuleLoaded).not.toHaveBeenCalled();
  });

  it("does not initialize CodeMirror when the base table view is imported", () => {
    expect(codeMirrorModuleLoaded).not.toHaveBeenCalled();
  });
});
