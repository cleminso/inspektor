import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { focusRowEditorField } from "@/components/table-explorer/data/editRowForm";

afterEach(cleanup);

describe("focusRowEditorField", () => {
  it("focuses the first control inside the requested row field", () => {
    const field = document.createElement("div");
    const input = document.createElement("input");
    field.id = "row-editor-field-displayName";
    field.append(input);
    document.body.append(field);

    expect(focusRowEditorField("displayName")).toBe(true);
    expect(document.activeElement).toBe(input);

    field.remove();
  });
});
