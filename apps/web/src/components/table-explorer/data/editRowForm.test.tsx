import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ColumnDescriptor } from "jazz-tools";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EditRowForm,
  focusRowEditorField,
} from "@/components/table-explorer/data/editRowForm";

vi.mock("@/components/providers/inspectorProvider", () => ({
  useInspector: () => ({
    currentBranch: "main",
    currentConnectionId: "connection-1",
    currentSchemaHash: "schema-1",
  }),
}));

const schemaColumns = [
  { name: "displayName", column_type: { type: "Text" }, nullable: false },
  { name: "age", column_type: { type: "Integer" }, nullable: false },
  { name: "active", column_type: { type: "Boolean" }, nullable: false },
] satisfies ColumnDescriptor[];

const rowValues = {
  active: true,
  displayName: "Ada.Lovelace",
  id: "person-1",
};

function renderEditRowForm() {
  return render(
    <EditRowForm
      onDelete={() => undefined}
      onSave={() => undefined}
      rowValues={rowValues}
      schemaColumns={schemaColumns}
      targetRowId="person-1"
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

describe("EditRowForm Details and JSON views", () => {
  it("selects Details by default", () => {
    renderEditRowForm();

    expect(screen.getByRole("group", { name: "Row representation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Details" }).getAttribute("data-pressed")).toBe("");
    expect(screen.getByRole("button", { name: "JSON" }).getAttribute("data-pressed")).toBeNull();
    expect(screen.getByLabelText("DisplayName")).toBeTruthy();
  });

  it("renders the complete row in schema order and marks missing fields unavailable", () => {
    renderEditRowForm();

    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    const json = screen.getByRole("tree");
    const rowFields = within(json)
      .getAllByRole("treeitem")
      .filter((item) => item.getAttribute("aria-level") === "2");

    expect(rowFields.map((item) => item.getAttribute("aria-label"))).toEqual([
      "id: person-1",
      "displayName: Ada.Lovelace",
      "age: object",
      "active: true",
    ]);
    fireEvent.click(within(json).getByRole("button", { name: "Expand age" }));
    expect(within(json).getByRole("treeitem", { name: "$type: unavailable" })).toBeTruthy();
  });

  it("shows JSON tools without visible mutation controls", () => {
    renderEditRowForm();

    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    expect(screen.getByRole("searchbox", { name: /search/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy row JSON" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "DisplayName" })).toBeNull();
  });

  it("preserves edited Details text after switching to JSON and back", () => {
    renderEditRowForm();
    const displayName = screen.getByLabelText("DisplayName");

    fireEvent.change(displayName, { target: { value: "Grace Hopper" } });
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    fireEvent.click(screen.getByRole("button", { name: "Details" }));

    expect((screen.getByLabelText("DisplayName") as HTMLInputElement).value).toBe("Grace Hopper");
  });

  it("highlights a literal JSON search term", () => {
    const { container } = renderEditRowForm();
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    fireEvent.change(screen.getByRole("searchbox", { name: /search/i }), {
      target: { value: "." },
    });

    expect(Array.from(container.querySelectorAll("mark"), (mark) => mark.textContent)).toEqual([
      ".",
    ]);
  });

  it("copies the pretty normalized row JSON", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderEditRowForm();
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    fireEvent.click(screen.getByRole("button", { name: "Copy row JSON" }));

    expect(writeText).toHaveBeenCalledWith(
      [
        "{",
        '  "id": "person-1",',
        '  "displayName": "Ada.Lovelace",',
        '  "age": {',
        '    "$type": "unavailable"',
        "  },",
        '  "active": true',
        "}",
      ].join("\n"),
    );
  });

  it("uses JsonView for a read-only structured field containing binary values", () => {
    const binaryArrayColumns = [
      {
        name: "payloads",
        column_type: { type: "Array", element: { type: "Bytea" } },
        nullable: false,
      },
    ] satisfies ColumnDescriptor[];
    render(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "file-1", payloads: [new Uint8Array([0, 1, 2])] }}
        schemaColumns={binaryArrayColumns}
        targetRowId="file-1"
      />,
    );

    const fieldTree = screen.getByRole("tree", { name: "Payloads value" });
    fireEvent.click(within(fieldTree).getByRole("button", { name: "Expand 0" }));

    expect(within(fieldTree).getByRole("treeitem", { name: /encoding: base64/i })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Payloads" })).toBeNull();
    expect(screen.getByText("Payloads").closest("label")?.hasAttribute("for")).toBe(false);
  });
});
