import { describe, expect, it, vi } from "vitest";

const rowEditorModuleLoaded = vi.hoisted(() => vi.fn());

vi.mock("@/components/table-explorer/data/editRowForm", () => {
  rowEditorModuleLoaded();

  return { EditRowForm: vi.fn() };
});

vi.mock("@/components/table-explorer/data/insertRowForm", () => {
  rowEditorModuleLoaded();

  return { InsertRowForm: vi.fn() };
});

import "./view";

describe("DataView module boundary", () => {
  it("does not initialize row-editor forms when the table view is imported", () => {
    expect(rowEditorModuleLoaded).not.toHaveBeenCalled();
  });
});
