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
        {disabled === false ? <button aria-label="Format JSON">Format JSON</button> : null}
        {disabled === false ? (
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
  it("gives an expanded editor the insert form scroll area while preserving the footer", async () => {
    const columns = [
      { name: "settings", column_type: { type: "Json" }, nullable: false },
    ] satisfies ColumnDescriptor[];
    const { container } = render(
      <InsertRowForm onSave={() => undefined} rowValues={{ settings: {} }} schemaColumns={columns} />,
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

    expect(onSave).toHaveBeenCalledWith({ settings: { enabled: true } }, { keepOpen: false });
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

    fireEvent.click(screen.getByRole("checkbox", { name: /payload/i }));

    expect((await screen.findByRole("textbox", { name: "Payload" })).textContent).toBe(seed);
  });
});
