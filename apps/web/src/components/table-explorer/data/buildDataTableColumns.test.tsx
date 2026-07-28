import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "@inspector/ds";

import { buildDataTableColumns } from "@/components/table-explorer/data/buildDataTableColumns";

function TestTable({
  columns,
  data,
  onRowSelectionRequest,
  onSortingChange,
}: {
  columns?: Parameters<typeof buildDataTableColumns>[0]["columns"];
  data?: DynamicTableRow[];
  onRowSelectionRequest?: (request: { checked: boolean; rowId: string; shiftKey: boolean }) => void;
  onSortingChange: () => void;
}): React.ReactElement {
  const table = useReactTable({
    columns: buildDataTableColumns({
      columns: columns ?? [
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
    data: data ?? [{ id: "row-1", name: "Ada" } as DynamicTableRow],
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
          accessorKey: "id",
          column: null,
          id: "id",
          isSortable: true,
          label: "Id",
        },
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

    expect(columns.find((column) => column.id === "id")?.size).toBe(320);
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

  it("renders explicit compact primitive states and aligns numbers", () => {
    render(
      <TestTable
        columns={[
          {
            accessorKey: "empty",
            column: { column_type: { type: "Text" }, name: "empty", nullable: false } as never,
            id: "empty",
            isSortable: true,
            label: "Empty",
          },
          {
            accessorKey: "missing",
            column: { column_type: { type: "Text" }, name: "missing", nullable: true } as never,
            id: "missing",
            isSortable: true,
            label: "Missing",
          },
          {
            accessorKey: "count",
            column: { column_type: { type: "Integer" }, name: "count", nullable: false } as never,
            id: "count",
            isSortable: true,
            label: "Count",
          },
          {
            accessorKey: "enabled",
            column: { column_type: { type: "Boolean" }, name: "enabled", nullable: false } as never,
            id: "enabled",
            isSortable: true,
            label: "Enabled",
          },
        ]}
        data={[
          { id: "row-1", empty: "", missing: null, count: 42, enabled: false } as DynamicTableRow,
        ]}
        onSortingChange={() => undefined}
      />,
    );

    expect(screen.getByText('""')).toBeTruthy();
    expect(screen.getByText("NULL")).toBeTruthy();
    expect(screen.getByText("42").getAttribute("data-cell-alignment")).toBe("end");
    expect(screen.getByText("false")).toBeTruthy();
    expect(screen.getByLabelText("Boolean false")).toBeTruthy();
  });

  it("renders row IDs as continuous truncated text", () => {
    const id = "row_0123456789abcdefghijklmnopqrstuvwxyz";
    render(
      <TestTable
        columns={[{ accessorKey: "id", column: null, id: "id", isSortable: true, label: "id" }]}
        data={[{ id } as DynamicTableRow]}
        onSortingChange={() => undefined}
      />,
    );

    const idValue = screen.getByLabelText(id);
    expect(idValue.textContent).toBe(id);
    expect(idValue.getAttribute("data-cell-overflow")).toBe("truncate");
  });

  it("renders bounded structured and binary previews", () => {
    render(
      <TestTable
        columns={[
          {
            accessorKey: "payload",
            column: { column_type: { type: "Bytea" }, name: "payload", nullable: false } as never,
            id: "payload",
            isSortable: false,
            label: "Payload",
          },
          {
            accessorKey: "tags",
            column: {
              column_type: { type: "Array", element: { type: "Text" } },
              name: "tags",
              nullable: false,
            } as never,
            id: "tags",
            isSortable: false,
            label: "Tags",
          },
        ]}
        data={[
          {
            id: "row-1",
            payload: new Uint8Array(317),
            tags: ["reader", "writer", "reader", "owner"],
          } as DynamicTableRow,
        ]}
        onSortingChange={() => undefined}
      />,
    );

    expect(screen.getByText("317 B")).toBeTruthy();
    expect(screen.getByText(/^\[4\] "reader", "writer", "reader"/)).toBeTruthy();
    expect(screen.queryByText(/0,0,0/)).toBeNull();
    expect(screen.getByText("317 B").closest("[title]")).toBeNull();
    expect(screen.getByText(/reader/).closest("[title]")).toBeNull();
  });

  it("renders timestamp and shallow structured values without traversing nested containers", () => {
    const timestamp = new Date("2026-07-27T14:03:04.987Z");
    let nestedReads = 0;
    const nested = {};
    Object.defineProperty(nested, "secret", {
      enumerable: true,
      get: () => {
        nestedReads += 1;
        return new Uint8Array([1, 2, 3]);
      },
    });
    const circular: Record<string, unknown> = { enabled: true, nested };
    circular.self = circular;

    render(
      <TestTable
        columns={[
          {
            accessorKey: "createdAt",
            column: { column_type: { type: "Timestamp" }, name: "createdAt" } as never,
            id: "createdAt",
            isSortable: true,
            label: "Created at",
          },
          {
            accessorKey: "metadata",
            column: { column_type: { type: "Json", schema: {} }, name: "metadata" } as never,
            id: "metadata",
            isSortable: false,
            label: "Metadata",
          },
        ]}
        data={[{ id: "row-1", createdAt: timestamp, metadata: circular } as DynamicTableRow]}
        onSortingChange={() => undefined}
      />,
    );

    expect(screen.getByText(new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      second: "2-digit",
      year: "numeric",
    }).format(timestamp)).tagName).toBe("TIME");
    expect(screen.getByText("{T}")).toBeTruthy();
    expect(screen.getByText(/enabled: true/).tagName).toBe("CODE");
    expect(nestedReads).toBe(0);
  });
});
