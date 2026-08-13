import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { CodeEditorProps } from "@inspector/ds";
import type { ColumnDescriptor } from "jazz-tools";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EditRowForm, focusRowEditorField } from "@tables/rowEditor/editForm";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: React.ComponentProps<"a">) => <a href="/relation">{children}</a>,
}));

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
      readOnly = false,
      value,
    }: CodeEditorProps) => (
      <div data-expanded={expanded} data-layout={layout} data-slot="code-editor">
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
        {disabled === false && readOnly === false ? (
          <button aria-label="Format JSON" type="button">
            Format JSON
          </button>
        ) : null}
        {disabled === false && readOnly === false ? (
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

vi.mock("@app/providers/inspectorProvider", () => ({
  useInspectorSessionState: () => ({
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

describe("EditRowForm loading state", () => {
  it("identifies a requested row as loading while its live query reconnects", () => {
    render(
      <EditRowForm
        onSave={vi.fn()}
        rowValues={null}
        schemaColumns={schemaColumns}
        targetRowId="row-1"
      />,
    );

    expect(screen.getByRole("status").textContent).toContain("Loading row");
    expect(screen.queryByText("Select a row from the data table to edit it.")).toBeNull();
  });
});

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

  it("reports when a requested row field has no focusable control", () => {
    const field = document.createElement("div");
    field.id = "row-editor-field-settings";
    field.dataset.valueMode = "value";
    document.body.append(field);

    expect(focusRowEditorField("settings")).toBe(false);

    field.remove();
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
    const valueModeControl = document.createElement("button");
    valueModeControl.dataset.valueModeControl = "";
    valueModeControl.type = "button";
    field.append(hiddenEditor, valueModeControl);
    document.body.append(field);

    expect(focusRowEditorField("settings")).toBe(true);
    expect(document.activeElement).toBe(valueModeControl);

    field.remove();
  });

  it("focuses the value-mode control while a structured field uses its default", () => {
    const field = document.createElement("div");
    field.id = "row-editor-field-settings";
    field.dataset.valueMode = "omitted";
    const valueModeControl = document.createElement("button");
    valueModeControl.dataset.valueModeControl = "";
    valueModeControl.type = "button";
    field.append(valueModeControl);
    document.body.append(field);

    expect(focusRowEditorField("settings")).toBe(true);
    expect(document.activeElement).toBe(valueModeControl);

    field.remove();
  });
});

describe("EditRowForm Details and JSON views", () => {
  it("uses monospace typography for the synthetic row ID value", () => {
    renderEditRowForm();

    expect(screen.getByRole("textbox", { name: "ID" }).getAttribute("data-font")).toBe("mono");
  });

  it("selects Details by default", () => {
    renderEditRowForm();

    expect(screen.getByRole("group", { name: "Row representation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Details" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "JSON" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.getByLabelText("DisplayName")).toBeTruthy();
  });

  it("places the synthetic ID type at the trailing edge of its field header", () => {
    renderEditRowForm();

    const header = screen.getByText("ID").closest('[data-slot="row-id-field-header"]');

    expect(header?.lastElementChild?.textContent).toBe("UUID");
    expect(header === null ? null : getComputedStyle(header).width).toBe("100%");
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
    const { container } = renderEditRowForm();

    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    expect(screen.getByRole("searchbox", { name: "Find in row JSON" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Previous match" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next match" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy JSON" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "DisplayName" })).toBeNull();
    expect(
      screen.getByRole("tree", { name: "Row JSON" }).closest('[data-scrollbar="overlay"]'),
    ).toBeTruthy();
    expect(container.querySelectorAll("[data-scrollbar-gutter]")).toHaveLength(0);
  });

  it("overlays the Details scrollbar without placing actions in the viewport", () => {
    const { container } = renderEditRowForm();

    const viewport = container.querySelector('[data-row-editor-scroll-owner="form"]');

    expect(viewport?.getAttribute("data-scrollbar")).toBe("hidden");
    expect(viewport?.closest('[data-scrollbar="overlay"]')).toBeTruthy();
    expect(viewport?.contains(screen.getByRole("button", { name: "Save" }))).toBe(false);
  });

  it("preserves edited Details text after switching to JSON and back", () => {
    renderEditRowForm();
    const displayName = screen.getByLabelText("DisplayName");

    fireEvent.change(displayName, { target: { value: "Grace Hopper" } });
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    fireEvent.click(screen.getByRole("button", { name: "Details" }));

    expect((screen.getByLabelText("DisplayName") as HTMLInputElement).value).toBe("Grace Hopper");
  });

  it("submits only fields changed from the latest live source row", async () => {
    const onSave = vi.fn();
    render(
      <EditRowForm
        onSave={onSave}
        rowValues={{ id: "person-1", displayName: "Ada", age: 37, active: true }}
        schemaColumns={schemaColumns}
        targetRowId="person-1"
      />,
    );

    fireEvent.change(screen.getByLabelText("DisplayName"), { target: { value: "Grace" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ displayName: "Grace" }));
  });

  it("reports dirty state and returns to clean when a field matches the live source", async () => {
    const onDirtyChange = vi.fn();
    render(
      <EditRowForm
        onDirtyChange={onDirtyChange}
        onSave={() => undefined}
        rowValues={{ id: "person-1", displayName: "Ada", age: 37, active: true }}
        schemaColumns={schemaColumns}
        targetRowId="person-1"
      />,
    );
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));

    fireEvent.change(screen.getByLabelText("DisplayName"), { target: { value: "Grace" } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));

    fireEvent.change(screen.getByLabelText("DisplayName"), { target: { value: "Ada" } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
  });

  it("returns to clean when edited JSON is restored to its source NULL value", async () => {
    const onDirtyChange = vi.fn();
    const columns = [
      { name: "settings", column_type: { type: "Json" }, nullable: true },
    ] satisfies ColumnDescriptor[];
    render(
      <EditRowForm
        onDirtyChange={onDirtyChange}
        onSave={() => undefined}
        rowValues={{ id: "profile-1", settings: null }}
        schemaColumns={columns}
        targetRowId="profile-1"
      />,
    );
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));

    const nullToggle = screen.getByRole("button", { name: "NULL" });
    fireEvent.click(screen.getByRole("button", { name: "Value" }));
    const editor = await screen.findByRole("textbox", { name: "Settings" });
    fireEvent.input(editor, { target: { textContent: '{"enabled":true}' } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));

    fireEvent.click(nullToggle);
    fireEvent.input(editor, { target: { textContent: '{"enabled":true}' } });

    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
  });

  it("applies a changed timestamp before saving", async () => {
    const onSave = vi.fn();
    const initialTimestamp = new Date(2026, 7, 13, 9, 10, 11, 120);
    const columns = [
      { name: "publishedAt", column_type: { type: "Timestamp" }, nullable: true },
    ] satisfies ColumnDescriptor[];
    render(
      <EditRowForm
        onSave={onSave}
        rowValues={{ id: "post-1", publishedAt: initialTimestamp.getTime() }}
        schemaColumns={columns}
        targetRowId="post-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "PublishedAt" }));
    fireEvent.click(screen.getByRole("button", { name: /Friday, August 14th, 2026/i }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        publishedAt: new Date(2026, 7, 14, 9, 10, 11, 120).getTime(),
      }),
    );
  });

  it("does not submit a clean row", () => {
    const onSave = vi.fn();
    render(
      <EditRowForm
        onSave={onSave}
        rowValues={{ id: "person-1", displayName: "Ada", age: 37, active: true }}
        schemaColumns={schemaColumns}
        targetRowId="person-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("reflects live source changes in untouched fields while preserving dirty fields", () => {
    const { rerender } = render(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "person-1", displayName: "Ada", age: 37, active: true }}
        schemaColumns={schemaColumns}
        targetRowId="person-1"
      />,
    );
    fireEvent.change(screen.getByLabelText("DisplayName"), { target: { value: "Grace" } });

    rerender(
      <EditRowForm
        onSave={() => undefined}
        rowValues={{ id: "person-1", displayName: "Katherine", age: 38, active: false }}
        schemaColumns={schemaColumns}
        targetRowId="person-1"
      />,
    );

    expect((screen.getByLabelText("DisplayName") as HTMLInputElement).value).toBe("Grace");
    expect((screen.getByLabelText("Age") as HTMLInputElement).value).toBe("38");
    expect(screen.getByRole("button", { name: "False" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("highlights and reports a literal JSON find query", async () => {
    const { container } = renderEditRowForm();
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    fireEvent.change(screen.getByRole("searchbox", { name: "Find in row JSON" }), {
      target: { value: "." },
    });

    expect(Array.from(container.querySelectorAll("mark"), (mark) => mark.textContent)).toEqual([
      ".",
    ]);
    expect(await screen.findByRole("status", { name: "Match 1 of 1" })).toBeTruthy();
    expect(container.querySelector("mark")?.hasAttribute("data-active")).toBe(true);

    fireEvent.change(screen.getByRole("searchbox", { name: "Find in row JSON" }), {
      target: { value: "missing" },
    });
    expect(await screen.findByRole("status", { name: "No matches" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Next match" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("applies Find Bar query options to row JSON matches", async () => {
    renderEditRowForm();
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    fireEvent.change(screen.getByRole("searchbox", { name: "Find in row JSON" }), {
      target: { value: "ada" },
    });
    expect(await screen.findByRole("status", { name: "Match 1 of 1" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Match case" }));

    expect(screen.getByRole("button", { name: "Match case" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(await screen.findByRole("status", { name: "No matches" })).toBeTruthy();
  });

  it("copies the pretty normalized row JSON", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderEditRowForm();
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    fireEvent.click(screen.getByRole("button", { name: "Copy JSON" }));

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

  it("uses a bounded CodeEditor marker for a read-only structured field containing binary values", () => {
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

    const editor = screen.getByRole("textbox", { name: "Payloads" });
    expect(editor.textContent).toContain('"$type": "bytes"');
    expect(editor.textContent).toContain('"byteLength": 3');
    expect(editor.textContent).not.toContain('"0": 0');
    expect(screen.queryByRole("tree", { name: "Payloads value" })).toBeNull();
  });

  it("disables a NULL relation control and submits an edit after switching back to a value", async () => {
    const onSave = vi.fn();
    const columns = [
      {
        name: "accountId",
        column_type: { type: "Uuid" },
        nullable: true,
        references: "accounts",
      },
    ] satisfies ColumnDescriptor[];
    render(
      <EditRowForm
        onSave={onSave}
        rowValues={{ id: "profile-1", accountId: null }}
        schemaColumns={columns}
        targetRowId="profile-1"
      />,
    );

    const input = screen.getByLabelText("AccountId") as HTMLInputElement;
    expect(input.disabled).toBe(true);

    fireEvent.click(screen.getByRole("checkbox", { name: "Set AccountId to NULL" }));
    expect(input.disabled).toBe(false);
    fireEvent.change(input, { target: { value: "account-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith({ accountId: "account-2" }));
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
    expect(within(editorRoot as HTMLElement).queryByText("JSON")).toBeNull();
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
    const valueModeControl = screen.getByRole("button", { name: "NULL" });

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

    const nullToggle = screen.getByRole("button", { name: "NULL" });
    const editor = await screen.findByRole("textbox", { name: "Settings" });
    expect(editor.textContent).toContain('"enabled"');

    fireEvent.click(nullToggle);

    expect(container.querySelector("#row-editor-settings")).toBeNull();
    expect(screen.queryByRole("button", { name: "Format JSON" })).toBeNull();
    const nullPresentation = screen.getByLabelText("Settings value: NULL");
    expect(within(nullPresentation).queryByText("JSON")).toBeNull();
    expect(container.querySelector("input[data-null-value]")).toBeNull();
    expect(focusRowEditorField("settings")).toBe(true);
    expect(document.activeElement).toBe(nullToggle);

    fireEvent.click(screen.getByRole("button", { name: "Value" }));

    const restoredEditor = await screen.findByRole("textbox", { name: "Settings" });
    expect(restoredEditor).not.toBe(editor);
    expect(restoredEditor.textContent).toContain('"enabled"');
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
        rowValues={{ id: "row-1", items: [] }}
        schemaColumns={columns}
        targetRowId="row-1"
      />,
    );
    const field = container.querySelector<HTMLElement>("#row-editor-field-items");
    Object.defineProperty(field, "scrollIntoView", { configurable: true, value: scrollIntoView });
    const editor = await screen.findByRole("textbox", { name: "Items" });
    fireEvent.input(editor, { target: { textContent: "{}" } });

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
        rowValues={{ id: "profile-1", age: 37, settings: { enabled: true } }}
        schemaColumns={columns}
        targetRowId="profile-1"
      />,
    );
    const age = screen.getByLabelText("Age");
    const settings = await screen.findByRole("textbox", { name: "Settings" });
    fireEvent.change(age, { target: { value: "not-a-number" } });

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

    fireEvent.change(screen.getByLabelText("DisplayName"), { target: { value: "Grace" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Save failed");
  });

  it("does not submit the same dirty patch twice while a save is pending", async () => {
    let resolveSave: (() => void) | undefined;
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    render(
      <EditRowForm
        onSave={onSave}
        rowValues={{ ...rowValues, age: 42 }}
        schemaColumns={schemaColumns}
        targetRowId="person-1"
      />,
    );
    fireEvent.change(screen.getByLabelText("DisplayName"), { target: { value: "Grace" } });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.submit(
      screen.getByRole("button", { name: "Save" }).closest("form") as HTMLFormElement,
    );

    expect(onSave).toHaveBeenCalledOnce();
    await act(async () => {
      resolveSave?.();
    });
  });

  it("announces delete errors and retains the row controls", async () => {
    render(
      <EditRowForm
        onDelete={() => {
          throw new Error("Delete failed");
        }}
        onSave={() => undefined}
        rowValues={rowValues}
        schemaColumns={schemaColumns}
        targetRowId="person-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Delete failed");
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });
});
