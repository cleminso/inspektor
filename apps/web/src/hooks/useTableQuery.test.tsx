import { renderHook } from "@testing-library/react";
import type { DynamicTableRow } from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTableQuery } from "@/hooks/useTableQuery";

let queryRows: DynamicTableRow[] | undefined;
let sortColumn = "id";
let sortDirection: "asc" | "desc" = "asc";

vi.mock("@/components/providers/inspectorProvider", () => ({
  useInspector: () => ({
    currentSchemaHash: "schema-1",
    runtime: { wasmSchema: {} },
  }),
}));

vi.mock("@/hooks/useTableExplorerSearchParams", () => ({
  useTableExplorerSearchParams: () => ({ filters: [], sortColumn, sortDirection }),
}));

vi.mock("@/lib/table-explorer/tableSchema", () => ({ getTableColumns: () => [] }));

vi.mock("@/lib/table-explorer/genericQueryBuilder", () => ({
  GenericQueryBuilder: class GenericQueryBuilder {
    limit() {
      return this;
    }
    offset() {
      return this;
    }
    orderBy() {
      return this;
    }
    where() {
      return this;
    }
  },
}));

vi.mock("jazz-tools/react", () => ({ useAll: () => queryRows }));

beforeEach(() => {
  queryRows = undefined;
  sortColumn = "id";
  sortDirection = "asc";
});

describe("useTableQuery", () => {
  it("keeps resolved rows visible while a new sort subscription resolves", () => {
    queryRows = [
      { id: "row-1", name: "Ada" } as DynamicTableRow,
      { id: "row-2", name: "Grace" } as DynamicTableRow,
    ];
    const { result, rerender } = renderHook(() => useTableQuery({ tableName: "users" }));

    expect(result.current.rows.map((row) => row.id)).toEqual(["row-1", "row-2"]);

    sortColumn = "name";
    sortDirection = "desc";
    queryRows = undefined;
    rerender();

    expect(result.current.rows.map((row) => row.id)).toEqual(["row-1", "row-2"]);
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.isFetchingMore).toBe(false);
  });
});
