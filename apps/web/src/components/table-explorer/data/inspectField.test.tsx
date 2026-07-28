import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CodeEditorProps } from "@inspector/ds";
import type { ColumnDescriptor, ColumnType } from "jazz-tools";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InspectField } from "@/components/table-explorer/data/inspectField";

const relationState = vi.hoisted(() => ({
  value: { status: "resolved", displayValue: "Ada" } as
    | { status: "pending" }
    | { status: "resolved"; displayValue: string }
    | { status: "missing" },
}));

vi.mock("@inspector/ds", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@inspector/ds")>();

  return {
    ...actual,
    CodeEditor: ({ accessibilityLabel, labelledBy, readOnly, value }: CodeEditorProps) => (
      <div
        aria-label={accessibilityLabel}
        aria-labelledby={labelledBy}
        aria-readonly={readOnly}
        data-slot="code-editor"
        role="textbox"
        tabIndex={0}
      >
        {value}
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

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: React.ComponentProps<"a">) => <a href="/relation">{children}</a>,
}));

vi.mock("@/hooks/useRelationRow", () => ({
  useRelationRow: () => relationState.value,
}));

afterEach(cleanup);

function column(
  name: string,
  columnType: ColumnDescriptor["column_type"],
  options: Partial<ColumnDescriptor> = {},
): ColumnDescriptor {
  return { column_type: columnType, name, nullable: false, ...options } as ColumnDescriptor;
}

describe("InspectField", () => {
  it("renders scalar and schema-less ID values in read-only inputs", () => {
    const { rerender } = render(
      <InspectField
        column={column("name", { type: "Text" })}
        targetIdentity="row-1:name"
        value="Ada"
      />,
    );

    const scalar = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    expect(scalar.readOnly).toBe(true);
    expect(scalar.value).toBe("Ada");

    rerender(<InspectField column={null} name="id" targetIdentity="row-1:id" value="row-1" />);

    const id = screen.getByRole("textbox", { name: "Id" }) as HTMLInputElement;
    expect(id.readOnly).toBe(true);
    expect(id.value).toBe("row-1");
  });

  it.each([
    ["Json", { enabled: true }, '{\n  "enabled": true\n}'],
    ["Array", ["a"], '[\n  "a"\n]'],
    ["Row", { name: "Ada" }, '{\n  "name": "Ada"\n}'],
  ] as const)("renders %s values in a read-only CodeEditor", (type, value, source) => {
    const columnType: ColumnType =
      type === "Array"
        ? { type, element: { type: "Text" } }
        : type === "Row"
          ? { type, columns: [] }
          : { type };

    render(
      <InspectField
        column={column("details", columnType)}
        targetIdentity={`row-1:${type}`}
        value={value}
      />,
    );

    const editor = screen.getByRole("textbox", { name: "Details" });
    expect(editor.getAttribute("aria-readonly")).toBe("true");
    expect(editor.textContent).toBe(source);
    expect(screen.queryByRole("button", { name: /format|expand/i })).toBeNull();
  });

  it("falls back to JsonView when a structured value cannot be safely serialized", () => {
    const value: Record<string, unknown> = {};
    value.self = value;

    render(
      <InspectField
        column={column("details", { type: "Json" })}
        targetIdentity="row-1:details"
        value={value}
      />,
    );

    expect(screen.getByRole("tree", { name: "Details value" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Details" })).toBeNull();
  });

  it("uses CodeEditor with a bounded marker for structured runtime values containing bytes", () => {
    render(
      <InspectField
        column={column("details", { type: "Json" })}
        targetIdentity="row-1:details"
        value={{ payload: new Uint8Array([0, 1, 2]) }}
      />,
    );

    const editor = screen.getByRole("textbox", { name: "Details" });
    expect(editor.textContent).toContain('"$type": "bytes"');
    expect(editor.textContent).toContain('"byteLength": 3');
    expect(editor.textContent).not.toContain('"0": 0');
    expect(screen.queryByRole("tree", { name: "Details value" })).toBeNull();
  });

  it("traverses an ordinary structured value only for its preview and serialization", () => {
    let getterReads = 0;
    const value = Object.defineProperty({}, "name", {
      enumerable: true,
      get() {
        getterReads += 1;
        return "Ada";
      },
    });

    render(
      <InspectField
        column={column("details", { type: "Json" })}
        targetIdentity="row-1:details"
        value={value}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Details" }).textContent).toContain('"name": "Ada"');
    expect(getterReads).toBe(2);
  });

  it("uses controlled boolean and enum form controls without changing their values", () => {
    const { rerender } = render(
      <InspectField
        column={column("active", { type: "Boolean" })}
        targetIdentity="row-1:active"
        value={true}
      />,
    );

    const trueButton = screen.getByRole("button", { name: "True" });
    const falseButton = screen.getByRole("button", { name: "False" });
    expect(trueButton.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(falseButton);
    expect(trueButton.getAttribute("aria-pressed")).toBe("true");

    rerender(
      <InspectField
        column={column("status", { type: "Enum", variants: ["active", "archived"] })}
        targetIdentity="row-1:status"
        value="active"
      />,
    );

    expect(screen.getByRole("combobox", { name: "Status" }).textContent).toContain("active");
  });

  it("focuses the labelled field fallback instead of disabled Boolean controls", () => {
    render(
      <InspectField
        column={column("active", { type: "Boolean" })}
        targetIdentity="row-1:active"
        value={true}
      />,
    );

    expect(document.activeElement).toBe(document.getElementById("cell-inspector-field-active"));
    expect(document.activeElement?.getAttribute("aria-labelledby")).toBe(
      "cell-inspector-active-label",
    );
  });

  it("focuses the labelled field fallback instead of a disabled Enum control", () => {
    render(
      <InspectField
        column={column("status", { type: "Enum", variants: ["active", "archived"] })}
        targetIdentity="row-1:status"
        value="active"
      />,
    );

    expect(document.activeElement).toBe(document.getElementById("cell-inspector-field-status"));
    expect(document.activeElement?.getAttribute("aria-labelledby")).toBe(
      "cell-inspector-status-label",
    );
  });

  it("preserves a malformed enum as a read-only raw value", () => {
    render(
      <InspectField
        column={column("status", { type: "Enum", variants: ["active", "archived"] })}
        targetIdentity="row-1:status"
        value="removed"
      />,
    );

    const value = screen.getByRole("textbox", { name: "Status" }) as HTMLInputElement;
    expect(value.readOnly).toBe(true);
    expect(value.value).toBe("removed");
    expect(screen.queryByRole("combobox", { name: "Status" })).toBeNull();
  });

  it("keeps NULL, unavailable, and binary values explicit and read-only", () => {
    const { rerender } = render(
      <InspectField
        column={column("payload", { type: "Json" }, { nullable: true })}
        targetIdentity="row-1:payload"
        value={null}
      />,
    );

    const nullValue = screen.getByRole("textbox", { name: "Payload" }) as HTMLInputElement;
    expect(nullValue.readOnly).toBe(true);
    expect(nullValue.value).toBe("NULL");

    rerender(
      <InspectField
        column={column("payload", { type: "Bytea" })}
        targetIdentity="row-1:payload-bytes"
        value={new Uint8Array([1, 2])}
      />,
    );

    const binaryValue = screen.getByRole("textbox", { name: "Payload" }) as HTMLInputElement;
    expect(binaryValue.readOnly).toBe(true);
    expect(binaryValue.value).toBe("2 B");
    expect(screen.getByRole("button", { name: "Copy as" })).toBeTruthy();
    expect(screen.getByText("Read-only: binary field")).toBeTruthy();

    rerender(
      <InspectField
        column={column("payload", { type: "Json" }, { nullable: true })}
        targetIdentity="row-1:missing"
        value={undefined}
      />,
    );
    expect((screen.getByRole("textbox", { name: "Payload" }) as HTMLInputElement).value).toBe(
      "Unavailable",
    );
  });

  it("renders valid timestamps with their DS detail presentation and malformed raw values", () => {
    const epochMilliseconds = Date.parse("2026-07-27T14:03:04Z");
    const { rerender } = render(
      <InspectField
        column={column("createdAt", { type: "Timestamp" })}
        targetIdentity="row-1:createdAt"
        value={epochMilliseconds}
      />,
    );

    expect(screen.getByText("Raw epoch").nextElementSibling?.textContent).toBe(
      String(epochMilliseconds),
    );
    expect(screen.getByText("Local")).toBeTruthy();

    rerender(
      <InspectField
        column={column("createdAt", { type: "Timestamp" })}
        targetIdentity="row-2:createdAt"
        value="malformed"
      />,
    );
    expect((screen.getByRole("textbox", { name: "CreatedAt" }) as HTMLInputElement).value).toBe(
      "malformed",
    );
  });

  it("focuses the labelled field fallback for timestamp details", () => {
    render(
      <InspectField
        column={column("createdAt", { type: "Timestamp" })}
        targetIdentity="row-1:createdAt"
        value={Date.parse("2026-07-27T14:03:04Z")}
      />,
    );

    expect(document.activeElement).toBe(document.getElementById("cell-inspector-field-createdAt"));
    expect(document.activeElement?.getAttribute("aria-labelledby")).toBe(
      "cell-inspector-createdAt-label",
    );
  });

  it("keeps a relation raw ID primary and provides navigation", () => {
    render(
      <InspectField
        column={column("accountId", { type: "Uuid" }, { references: "accounts" })}
        targetIdentity="row-1:accountId"
        value="account-1"
      />,
    );

    expect(screen.getByText("Stored ID").nextElementSibling?.textContent).toBe("account-1");
    expect(screen.getByText("Display value").nextElementSibling?.textContent).toBe("Ada");
    expect(screen.getByRole("status").textContent).toContain("Resolved");
    expect(screen.getByRole("link", { name: "Open target" })).toBeTruthy();
  });

  it.each(["pending", "missing"] as const)("renders a %s relation resolution state", (status) => {
    relationState.value = { status };
    render(
      <InspectField
        column={column("accountId", { type: "Uuid" }, { references: "accounts" })}
        targetIdentity={`row-1:${status}`}
        value="account-1"
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      status === "pending" ? "Pending" : "Missing target",
    );
  });

  it("focuses on target identity changes but not live value changes", () => {
    const { rerender } = render(
      <div>
        <button type="button">Outside</button>
        <InspectField
          column={column("name", { type: "Text" })}
          targetIdentity="row-1:name"
          value="Ada"
        />
      </div>,
    );
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(document.activeElement).toBe(input);

    const outside = screen.getByRole("button", { name: "Outside" });
    outside.focus();
    rerender(
      <div>
        <button type="button">Outside</button>
        <InspectField
          column={column("name", { type: "Text" })}
          targetIdentity="row-1:name"
          value="Grace"
        />
      </div>,
    );
    expect(document.activeElement).toBe(outside);

    rerender(
      <div>
        <button type="button">Outside</button>
        <InspectField
          column={column("name", { type: "Text" })}
          targetIdentity="row-2:name"
          value="Lin"
        />
      </div>,
    );
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Name" }));
  });

  it("restores internal focus when a same-target update replaces the representation", () => {
    const timestampColumn = column("createdAt", { type: "Timestamp" }, { nullable: true });
    const { rerender } = render(
      <InspectField column={timestampColumn} targetIdentity="row-1:createdAt" value={null} />,
    );
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "CreatedAt" }));

    rerender(
      <InspectField
        column={timestampColumn}
        targetIdentity="row-1:createdAt"
        value={Date.parse("2026-07-27T14:03:04Z")}
      />,
    );

    expect(document.activeElement).toBe(document.getElementById("cell-inspector-field-createdAt"));
  });

  it("leaves external focus untouched when a same-target update replaces the representation", () => {
    const timestampColumn = column("createdAt", { type: "Timestamp" }, { nullable: true });
    const { rerender } = render(
      <div>
        <button type="button">Outside</button>
        <InspectField column={timestampColumn} targetIdentity="row-1:createdAt" value={null} />
      </div>,
    );
    const outside = screen.getByRole("button", { name: "Outside" });
    outside.focus();

    rerender(
      <div>
        <button type="button">Outside</button>
        <InspectField
          column={timestampColumn}
          targetIdentity="row-1:createdAt"
          value={Date.parse("2026-07-27T14:03:04Z")}
        />
      </div>,
    );

    expect(document.activeElement).toBe(outside);
  });
});
