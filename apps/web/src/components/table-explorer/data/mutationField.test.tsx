import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ColumnDescriptor } from "jazz-tools";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MutationField } from "@/components/table-explorer/data/mutationField";

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

afterEach(cleanup);

function column(
  name: string,
  columnType: ColumnDescriptor["column_type"],
  options: Partial<ColumnDescriptor> = {},
): ColumnDescriptor {
  return { column_type: columnType, name, nullable: false, ...options } as ColumnDescriptor;
}

describe("MutationField", () => {
  it("lets a nullable Boolean leave NULL mode by selecting a value", () => {
    const onNullChange = vi.fn();
    const onTextChange = vi.fn();

    render(
      <MutationField
        canOmit={false}
        column={column("active", { type: "Boolean" }, { nullable: true })}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: true, isOmitted: false, text: "" }}
        hidden={false}
        initialValue={null}
        onExpandedChange={vi.fn()}
        onNullChange={onNullChange}
        onOmittedChange={vi.fn()}
        onTextChange={onTextChange}
        readOnlyReason={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "True" }));

    expect(onNullChange).toHaveBeenCalledWith(false);
    expect(onTextChange).toHaveBeenCalledWith("true");
  });

  it("presents valid timestamps as browser-local date-time input and stores epoch milliseconds", () => {
    const onTextChange = vi.fn();
    const initialDate = new Date(2024, 0, 2, 3, 4, 5);

    render(
      <MutationField
        canOmit={false}
        column={column("createdAt", { type: "Timestamp" })}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: false, isOmitted: false, text: String(initialDate.getTime()) }}
        hidden={false}
        initialValue={initialDate.getTime()}
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={vi.fn()}
        onTextChange={onTextChange}
        readOnlyReason={null}
      />,
    );

    const input = screen.getByLabelText("CreatedAt") as HTMLInputElement;
    expect(input.type).toBe("datetime-local");
    expect(input.value).toBe("2024-01-02T03:04:05.000");

    fireEvent.change(input, { target: { value: "2024-06-07T08:09:10" } });
    expect(onTextChange).toHaveBeenCalledWith(String(new Date(2024, 5, 7, 8, 9, 10).getTime()));
  });
});
