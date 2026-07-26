import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { CodeEditorProps } from "@inspector/ds";
import type { ColumnDescriptor } from "jazz-tools";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EditRowForm,
  focusRowEditorField,
} from "@/components/table-explorer/data/editRowForm";

vi.mock("@inspector/ds", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@inspector/ds")>();

  return {
    ...actual,
    CodeEditor: ({
      describedBy,
      disabled = false,
      expanded = false,
      id,
      invalid = false,
      layout = "intrinsic",
      labelledBy,
      onExpandedChange,
      onValueChange,
      toolbarLabel,
      value,
    }: CodeEditorProps) => (
      <div
        data-expanded={expanded}
        data-layout={layout}
        data-slot="code-editor"
      >
        {toolbarLabel === undefined ? null : <span>{toolbarLabel}</span>}
        <div
          id={id}
          aria-describedby={describedBy}
          aria-disabled={disabled}
          aria-invalid={invalid}
          aria-labelledby={labelledBy}
          role="textbox"
          tabIndex={disabled === true ? -1 : 0}
          onInput={(event) => {
            onValueChange?.(event.currentTarget.textContent ?? "");
          }}
        >
          {value}
        </div>
        {disabled === false ? (
          <button aria-label="Format JSON" type="button">
            Format JSON
          </button>
        ) : null}
        {disabled === false ? (
          <button
            type="button"
            aria-label={`${expanded === true ? "Collapse" : "Expand"} ${id}`}
            aria-expanded={expanded}
            onClick={() => {
              onExpandedChange?.(expanded === false);
            }}
          >
            {expanded === true ? "Collapse" : "Expand"}
          </button>
        ) : null}
      </div>
    ),
  };
});

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
  vi.useRealTimers();
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

  it("focuses a structured textbox when it becomes ready", async () => {
    const field = document.createElement("div");
    field.id = "row-editor-field-settings";
    field.dataset.valueMode = "value";
    document.body.append(field);

    expect(focusRowEditorField("settings")).toBe(true);

    const textbox = document.createElement("div");
    textbox.setAttribute("role", "textbox");
    textbox.tabIndex = 0;
    field.append(textbox);

    await waitFor(() => {
      expect(document.activeElement).toBe(textbox);
    });
    field.remove();
  });

  it("stops waiting when a structured textbox does not become ready", () => {
    vi.useFakeTimers();
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const field = document.createElement("div");
    field.id = "row-editor-field-settings";
    field.dataset.valueMode = "value";
    document.body.append(field);

    expect(focusRowEditorField("settings")).toBe(true);
    vi.runAllTimers();

    field.remove();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("focuses the value-mode control while a structured field is NULL", () => {
    const field = document.createElement("div");
    field.id = "row-editor-field-settings";
    field.dataset.valueMode = "null";
    const hiddenEditor = document.createElement("div");
    hiddenEditor.hidden = true;
    const textbox = document.createElement("div");
    textbox.setAttribute("role", "textbox");
    textbox.tabIndex = 0;
    hiddenEditor.append(textbox);
    const valueModeControl = document.createElement("input");
    valueModeControl.dataset.valueModeControl = "";
    valueModeControl.type = "checkbox";
    field.append(hiddenEditor, valueModeControl);
    document.body.append(field);

    expect(focusRowEditorField("settings")).toBe(true);
    expect(document.activeElement).toBe(valueModeControl);

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

  it("uses CodeEditor for an editable JSON field", async () => {
    const jsonColumns = [
      { name: "settings", column_type: { type: "Json" }, nullable: false },
    ] satisfies ColumnDescriptor[];
    render(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "profile-1", settings: { enabled: true } }}
        schemaColumns={jsonColumns}
        targetRowId="profile-1"
      />,
    );

    const editor = await screen.findByRole("textbox", { name: "Settings" });
    const editorRoot = editor.closest('[data-slot="code-editor"]');

    expect(editor.tagName).toBe("DIV");
    expect(editor.textContent).toContain('"enabled"');
    expect(within(editorRoot as HTMLElement).getByText("JSON")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Format JSON" })).toBeTruthy();
  });

  it("controls expanded structured fields without remounting editors", async () => {
    const columns = [
      { name: "title", column_type: { type: "Text" }, nullable: false },
      { name: "settings", column_type: { type: "Json" }, nullable: false },
      { name: "metadata", column_type: { type: "Json" }, nullable: false },
    ] satisfies ColumnDescriptor[];
    const { container } = render(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "profile-1", title: "Profile", settings: {}, metadata: {} }}
        schemaColumns={columns}
        targetRowId="profile-1"
      />,
    );
    const settingsEditor = await screen.findByRole("textbox", { name: "Settings" });
    const metadataEditor = await screen.findByRole("textbox", { name: "Metadata" });
    const settingsRoot = settingsEditor.closest('[data-slot="code-editor"]');

    expect(settingsRoot?.getAttribute("data-expanded")).toBe("false");
    expect(settingsRoot?.getAttribute("data-layout")).toBe("intrinsic");
    const scrollOwner = container.querySelector<HTMLElement>("[data-row-editor-scroll-owner]");
    expect(scrollOwner?.getAttribute("data-row-editor-scroll-owner")).toBe("form");

    fireEvent.click(screen.getByRole("button", { name: "Expand row-editor-settings" }));

    expect(screen.getByRole("textbox", { name: "Settings" })).toBe(settingsEditor);
    expect(settingsRoot?.getAttribute("data-expanded")).toBe("true");
    expect(settingsRoot?.getAttribute("data-layout")).toBe("fill");
    expect(container.querySelector("#row-editor-field-id")?.hasAttribute("hidden")).toBe(true);
    expect(container.querySelector("#row-editor-field-title")?.hasAttribute("hidden")).toBe(true);
    expect(container.querySelector("#row-editor-field-metadata")?.hasAttribute("hidden")).toBe(
      true,
    );
    expect(container.querySelector("#row-editor-metadata")).toBe(metadataEditor);
    expect(scrollOwner?.getAttribute("data-row-editor-scroll-owner")).toBe("editor");

    fireEvent.click(screen.getByRole("button", { name: "Collapse row-editor-settings" }));

    expect(screen.getByRole("textbox", { name: "Settings" })).toBe(settingsEditor);
    expect(screen.getByRole("textbox", { name: "Metadata" })).toBe(metadataEditor);
    expect(settingsRoot?.getAttribute("data-expanded")).toBe("false");
    expect(settingsRoot?.getAttribute("data-layout")).toBe("intrinsic");
    expect(container.querySelector("#row-editor-field-id")?.hasAttribute("hidden")).toBe(false);
    expect(container.querySelector("#row-editor-field-title")?.hasAttribute("hidden")).toBe(false);
    expect(container.querySelector("#row-editor-field-metadata")?.hasAttribute("hidden")).toBe(
      false,
    );
  });

  it("focuses an editable structured value when its label is clicked", async () => {
    const columns = [
      { name: "settings", column_type: { type: "Json" }, nullable: true },
    ] satisfies ColumnDescriptor[];
    render(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "profile-1", settings: {} }}
        schemaColumns={columns}
        targetRowId="profile-1"
      />,
    );
    const editor = await screen.findByRole("textbox", { name: "Settings" });

    fireEvent.click(screen.getByText("Settings"));

    expect(document.activeElement).toBe(editor);
  });

  it("focuses the value-mode control from a NULL structured field label", () => {
    const columns = [
      { name: "settings", column_type: { type: "Json" }, nullable: true },
    ] satisfies ColumnDescriptor[];
    render(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "profile-1", settings: null }}
        schemaColumns={columns}
        targetRowId="profile-1"
      />,
    );
    const valueModeControl = screen.getByRole("checkbox", { name: "Settings" });

    fireEvent.click(screen.getByText("Settings"));

    expect(document.activeElement).toBe(valueModeControl);
  });

  it("preserves structured source changes while typing", async () => {
    const jsonColumns = [
      { name: "settings", column_type: { type: "Json" }, nullable: false },
    ] satisfies ColumnDescriptor[];
    render(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "profile-1", settings: { enabled: true } }}
        schemaColumns={jsonColumns}
        targetRowId="profile-1"
      />,
    );
    const editor = await screen.findByRole("textbox", { name: "Settings" });

    fireEvent.input(editor, { target: { textContent: '{"enabled":false}' } });

    expect(editor.textContent).toBe('{"enabled":false}');
  });

  it("shows explicit NULL for nullable JSON and restores its source draft", async () => {
    const jsonColumns = [
      { name: "settings", column_type: { type: "Json" }, nullable: true },
    ] satisfies ColumnDescriptor[];
    const { container } = render(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "profile-1", settings: { enabled: true } }}
        schemaColumns={jsonColumns}
        targetRowId="profile-1"
      />,
    );

    const nullToggle = screen.getByRole("checkbox", { name: "Settings" });
    const editor = await screen.findByRole("textbox", { name: "Settings" });
    expect(editor.textContent).toContain('"enabled"');

    fireEvent.click(nullToggle);

    expect(container.querySelector("#row-editor-settings")).toBe(editor);
    expect(editor.closest("[hidden]")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Format JSON" })).toBeNull();
    const nullValue = container.querySelector<HTMLInputElement>("input[data-null-value]");
    expect(nullValue?.readOnly).toBe(true);
    expect(nullValue?.hasAttribute("data-disabled")).toBe(false);
    expect(nullValue?.value).toBe("");
    expect(focusRowEditorField("settings")).toBe(true);
    expect(document.activeElement).toBe(nullToggle);

    fireEvent.click(nullToggle);

    expect(await screen.findByRole("textbox", { name: "Settings" })).toBe(editor);
    expect(editor.textContent).toContain('"enabled"');
  });

  it("associates a structured field error and focuses the first invalid editor", async () => {
    const scrollIntoView = vi.fn();
    const columns = [
      {
        name: "items",
        column_type: { type: "Array", element: { type: "Text" } },
        nullable: false,
      },
    ] satisfies ColumnDescriptor[];
    const { container } = render(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "row-1", items: {} }}
        schemaColumns={columns}
        targetRowId="row-1"
      />,
    );
    const field = container.querySelector<HTMLElement>("#row-editor-field-items");
    Object.defineProperty(field, "scrollIntoView", { configurable: true, value: scrollIntoView });
    const editor = await screen.findByRole("textbox", { name: "Items" });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const error = await screen.findByText("Array must be valid JSON array.");
    await waitFor(() => {
      expect(document.activeElement).toBe(editor);
    });
    expect(editor.getAttribute("aria-describedby")).toBe(error.id);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("collapses an expanded structured editor before focusing a sibling error", async () => {
    const columns = [
      { name: "age", column_type: { type: "Integer" }, nullable: false },
      { name: "settings", column_type: { type: "Json" }, nullable: false },
    ] satisfies ColumnDescriptor[];
    render(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "profile-1", age: "not-a-number", settings: { enabled: true } }}
        schemaColumns={columns}
        targetRowId="profile-1"
      />,
    );
    const age = screen.getByLabelText("Age");
    const settings = await screen.findByRole("textbox", { name: "Settings" });

    fireEvent.click(screen.getByRole("button", { name: "Expand row-editor-settings" }));
    await waitFor(() => {
      expect(settings.closest('[data-slot="code-editor"]')?.getAttribute("data-expanded")).toBe(
        "true",
      );
    });
    expect(age.closest("[hidden]")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(age);
    });
    expect(age.closest("[hidden]")).toBeNull();
    expect(settings.closest('[data-slot="code-editor"]')?.getAttribute("data-expanded")).toBe(
      "false",
    );
  });

  it("announces save errors", async () => {
    render(
      <EditRowForm
        onSave={() => {
          throw new Error("Save failed");
        }}
        rowValues={{ ...rowValues, age: 42 }}
        schemaColumns={schemaColumns}
        targetRowId="person-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Save failed");
  });
});
