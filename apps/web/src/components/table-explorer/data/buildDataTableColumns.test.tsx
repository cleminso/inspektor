import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "@inspector/ds";

import { buildDataTableColumns } from "@/components/table-explorer/data/buildDataTableColumns";

function TestTable({
  onRowSelectionRequest,
  onSortingChange,
}: {
  onRowSelectionRequest?: (request: { checked: boolean; rowId: string; shiftKey: boolean }) => void;
  onSortingChange: () => void;
}): React.ReactElement {
  const table = useReactTable({
    columns: buildDataTableColumns({
      columns: [
        {
          accessorKey: "name",
          column: null,
          id: "name",
          isSortable: true,
          label: "Name",
        },
      ],
      onRowSelectionRequest,
    }),
    data: [{ id: "row-1", name: "Ada" } as DynamicTableRow],
    getCoreRowModel: getCoreRowModel(),
    onSortingChange,
  });

  return (
    <DataTable.Root table={table}>
      <DataTable.Viewport>
        <DataTable.Table aria-label="People">
          <DataTable.Content />
        </DataTable.Table>
      </DataTable.Viewport>
    </DataTable.Root>
  );
}

afterEach(cleanup);

describe("buildDataTableColumns", () => {
  it("renders sortable metadata without sorting on direct header click", () => {
    const onSortingChange = vi.fn();
    render(<TestTable onSortingChange={onSortingChange} />);

    const header = screen.getByRole("columnheader", { name: "Name" });
    fireEvent.click(header);

    expect(screen.queryByRole("button", { name: /sort name/i })).toBeNull();
    expect(onSortingChange).not.toHaveBeenCalled();
  });

  it("uses schema-aware initial column widths", () => {
    const columns = buildDataTableColumns({
      columns: [
        {
          accessorKey: "enabled",
          column: {
            column_type: { type: "Boolean" },
            name: "enabled",
          } as never,
          id: "enabled",
          isSortable: true,
          label: "Enabled",
        },
        {
          accessorKey: "metadata",
          column: {
            column_type: { type: "Json" },
            name: "metadata",
          } as never,
          id: "metadata",
          isSortable: false,
          label: "Metadata",
        },
      ],
    });

    expect(columns.find((column) => column.id === "enabled")?.size).toBe(96);
    expect(columns.find((column) => column.id === "metadata")?.size).toBe(320);
  });

  it("reports the Shift modifier when a row checkbox requests selection", () => {
    const onRowSelectionRequest = vi.fn();
    render(
      <TestTable
        onRowSelectionRequest={onRowSelectionRequest}
        onSortingChange={() => undefined}
      />,
    );

    const checkboxCell = screen.getByRole("checkbox", { name: "Select row row-1" }).closest("td");
    fireEvent.click(checkboxCell as HTMLTableCellElement, { shiftKey: true });

    expect(onRowSelectionRequest).toHaveBeenCalledWith({
      checked: true,
      rowId: "row-1",
      shiftKey: true,
    });
  });
});
