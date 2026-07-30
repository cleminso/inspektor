import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getCoreRowModel, useReactTable, type VisibilityState } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { DataGridColumnVisibility } from "@tables/grid/columnVisibility";

function VisibilityMenu(): React.ReactElement {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const table = useReactTable({
    columns: [
      { accessorKey: "id", enableHiding: false },
      { accessorKey: "name" },
      { accessorKey: "role" },
    ],
    data: [] as DynamicTableRow[],
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  return <DataGridColumnVisibility table={table} />;
}

afterEach(cleanup);

describe("DataGridColumnVisibility", () => {
  it("lists fixed and hideable columns and keeps the menu open for multiselect", () => {
    render(<VisibilityMenu />);

    fireEvent.click(screen.getByRole("button", { name: "Choose visible columns" }));

    expect(screen.getByRole("checkbox", { name: "Select id" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Select name" }));

    expect(screen.getByRole("checkbox", { name: "Select name" }).getAttribute("aria-checked")).toBe(
      "false",
    );
    expect(screen.getByRole("dialog", { name: "Visible columns" })).toBeTruthy();
  });

  it("restores every hideable column through one convenience action", () => {
    render(<VisibilityMenu />);

    fireEvent.click(screen.getByRole("button", { name: "Choose visible columns" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select name" }));
    fireEvent.click(screen.getByRole("button", { name: "Check all from role" }));

    expect(screen.getByRole("checkbox", { name: "Select name" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(screen.getByRole("checkbox", { name: "Select role" }).getAttribute("aria-checked")).toBe(
      "true",
    );
  });
});
