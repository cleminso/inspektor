import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CodeEditorProps } from "@inspector/ds";
import type { ColumnDescriptor } from "jazz-tools";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InsertRowForm } from "@/components/table-explorer/data/insertRowForm";

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
      readOnly = false,
      toolbarLabel,
      value,
    }: CodeEditorProps) => (
      <div data-expanded={expanded} data-layout={layout} data-slot="code-editor">
        {toolbarLabel === undefined ? null : <span>{toolbarLabel}</span>}
        <div
          id={id}
          aria-describedby={describedBy}
          aria-disabled={disabled}
          aria-invalid={invalid}
          aria-labelledby={labelledBy}
          role="textbox"
          tabIndex={disabled === true ? -1 : 0}
        >
          {value}
        </div>
        {disabled === false && readOnly === false ? (
          <button aria-label="Format JSON">Format JSON</button>
        ) : null}
        {disabled === false && readOnly === false ? (
          <button
            aria-label={`${expanded === true ? "Collapse" : "Expand"} ${id}`}
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("InsertRowForm structured values", () => {
  it("omits an untouched default-backed field from the insert payload", async () => {
    const onSave = vi.fn();
    const columns = [
      { name: "name", column_type: { type: "Text" }, nullable: false },
      {
        name: "status",
        column_type: { type: "Text" },
        nullable: false,
        default: { type: "Text", value: "active" },
      },
    ] satisfies ColumnDescriptor[];
    render(<InsertRowForm onSave={onSave} rowValues={{ name: "Ada" }} schemaColumns={columns} />);

    fireEvent.click(screen.getByRole("button", { name: "Insert" }));

    await vi.waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ name: "Ada" }, { keepOpen: false }),
    );
  });

  it("allows a default-backed field to be changed to an explicit value", async () => {
    const onSave = vi.fn();
    const columns = [
      {
        name: "status",
        column_type: { type: "Text" },
        nullable: false,
        default: { type: "Text", value: "active" },
      },
    ] satisfies ColumnDescriptor[];
    render(<InsertRowForm onSave={onSave} rowValues={{}} schemaColumns={columns} />);

    expect(
      screen
        .getByRole("checkbox", { name: "Use default for Status" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use default for Status" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Status" }), {
      target: { value: "archived" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Insert" }));

    await vi.waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ status: "archived" }, { keepOpen: false }),
    );
  });

  it("allows an edited field to return to schema-default omission", async () => {
    const onSave = vi.fn();
    const columns = [
      {
        name: "status",
        column_type: { type: "Text" },
        nullable: false,
        default: { type: "Text", value: "active" },
      },
    ] satisfies ColumnDescriptor[];
    render(<InsertRowForm onSave={onSave} rowValues={{}} schemaColumns={columns} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Use default for Status" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Status" }), {
      target: { value: "archived" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Use default for Status" }));
    fireEvent.click(screen.getByRole("button", { name: "Insert" }));

    await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith({}, { keepOpen: false }));
  });

  it("keeps a default-backed read-only binary field omitted", () => {
    const columns = [
      {
        name: "payload",
        column_type: { type: "Bytea" },
        nullable: false,
        default: { type: "Bytea", value: new Uint8Array([1, 2]) },
      },
    ] satisfies ColumnDescriptor[];
    render(<InsertRowForm onSave={() => undefined} rowValues={{}} schemaColumns={columns} />);

    expect(screen.queryByRole("checkbox", { name: "Payload" })).toBeNull();
    expect((screen.getByRole("textbox", { name: "Payload" }) as HTMLInputElement).value).toBe(
      "(2 bytes)",
    );
  });

  it("gives an expanded editor the insert form scroll area while preserving the footer", async () => {
    const columns = [
      { name: "settings", column_type: { type: "Json" }, nullable: false },
    ] satisfies ColumnDescriptor[];
    const { container } = render(
      <InsertRowForm
        onSave={() => undefined}
        rowValues={{ settings: {} }}
        schemaColumns={columns}
      />,
    );
    const editor = await screen.findByRole("textbox", { name: "Settings" });
    const editorRoot = editor.closest('[data-slot="code-editor"]');

    fireEvent.click(screen.getByRole("button", { name: "Expand row-editor-settings" }));

    expect(screen.getByRole("textbox", { name: "Settings" })).toBe(editor);
    expect(editorRoot?.getAttribute("data-expanded")).toBe("true");
    expect(editorRoot?.getAttribute("data-layout")).toBe("fill");
    expect(
      container
        .querySelector("[data-row-editor-scroll-owner]")
        ?.getAttribute("data-row-editor-scroll-owner"),
    ).toBe("editor");
    expect(screen.getByRole("button", { name: "Insert" })).toBeTruthy();
  });

  it("respects a supplied value for a nullable structured field", async () => {
    const onSave = vi.fn();
    const columns = [
      { name: "settings", column_type: { type: "Json" }, nullable: true },
    ] satisfies ColumnDescriptor[];
    render(
      <InsertRowForm
        onSave={onSave}
        rowValues={{ settings: { enabled: true } }}
        schemaColumns={columns}
      />,
    );

    expect((await screen.findByRole("textbox", { name: "Settings" })).textContent).toContain(
      '  "enabled": true',
    );
    fireEvent.click(screen.getByRole("button", { name: "Insert" }));

    expect(onSave).toHaveBeenCalledWith({ settings: '{"enabled":true}' }, { keepOpen: false });
  });

  it.each([
    ["Json", "{}"],
    ["Array", "[]"],
    ["Row", "{}"],
  ] as const)("seeds an empty %s field when switching to Value", async (type, seed) => {
    const columns = [
      {
        name: "payload",
        column_type:
          type === "Array"
            ? { type, element: { type: "Text" } as const }
            : type === "Row"
              ? { type, columns: [] }
              : { type },
        nullable: true,
      },
    ] satisfies ColumnDescriptor[];
    render(<InsertRowForm onSave={() => undefined} rowValues={{}} schemaColumns={columns} />);

    fireEvent.click(screen.getByRole("button", { name: "Value" }));

    expect((await screen.findByRole("textbox", { name: "Payload" })).textContent).toBe(seed);
  });

  it("disables NULL primitive and enum controls and submits values after they are enabled", async () => {
    const onSave = vi.fn();
    const columns = [
      { name: "name", column_type: { type: "Text" }, nullable: true },
      {
        name: "status",
        column_type: { type: "Enum", variants: ["active", "archived"] },
        nullable: true,
      },
      { name: "enabled", column_type: { type: "Boolean" }, nullable: true },
    ] satisfies ColumnDescriptor[];
    render(<InsertRowForm onSave={onSave} rowValues={{}} schemaColumns={columns} />);

    const name = screen.getByLabelText("Name") as HTMLInputElement;
    const status = screen.getByRole("combobox", { name: "Status" }) as HTMLButtonElement;
    expect(name.disabled).toBe(true);
    expect(status.disabled).toBe(true);
    expect((screen.getByRole("button", { name: "True" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect((screen.getByRole("button", { name: "False" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect((screen.getByRole("button", { name: "Null" }) as HTMLButtonElement).disabled).toBe(
      false,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Set Name to NULL" }));
    fireEvent.change(name, { target: { value: "Ada" } });
    fireEvent.click(screen.getByRole("button", { name: "True" }));
    fireEvent.click(screen.getByRole("button", { name: "Insert" }));

    await vi.waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        { enabled: true, name: "Ada", status: null },
        { keepOpen: false },
      ),
    );
  });
});
