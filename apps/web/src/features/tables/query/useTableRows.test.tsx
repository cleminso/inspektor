import { renderHook, waitFor } from "@testing-library/react";
import type { DynamicTableRow } from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTableRows } from "@tables/query/useTableRows";

let queryRows: DynamicTableRow[] | undefined;
let queryError: unknown;
let page = 1;
let pageSize: 100 | 500 | 1000 = 100;
let sortColumn = "id";
let sortDirection: "asc" | "desc" = "asc";
let runtimeClient: { manager: Record<string, never> } | null;
let runtimeSchema: Record<string, unknown> | null;
const setPage = vi.fn();
const setPageSize = vi.fn();

vi.mock("@app/providers/inspectorProvider", () => ({
  useInspectorSessionState: () => ({ currentSchemaHash: "schema-1" }),
  useRuntimeClient: () => runtimeClient,
  useRuntimeSchema: () => runtimeSchema,
}));

vi.mock("@tables/routing/useTableSearchParams", () => ({
  useTableExplorerSearchParams: () => ({
    filters: [],
    page,
    pageSize,
    setPage,
    setPageSize,
    sortColumn,
    sortDirection,
  }),
}));

vi.mock("@tables/schema/tableSchema", () => ({ getTableColumns: () => [] }));

vi.mock("@tables/query/genericQueryBuilder", () => ({
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

vi.mock("@tables/query/useJazzQueryState", () => ({
  useJazzQueryState: () =>
    queryError === null
      ? queryRows === undefined
        ? { status: "pending", data: undefined, error: null }
        : { status: "fulfilled", data: queryRows, error: null }
      : { status: "rejected", data: undefined, error: queryError },
}));

beforeEach(() => {
  queryRows = undefined;
  queryError = null;
  page = 1;
  pageSize = 100;
  setPage.mockReset();
  setPageSize.mockReset();
  sortColumn = "id";
  sortDirection = "asc";
  runtimeClient = { manager: {} };
  runtimeSchema = {};
});

describe("useTableRows", () => {
  it("keeps row loading active until the runtime can execute the query", () => {
    runtimeClient = null;
    runtimeSchema = null;

    const { result } = renderHook(() =>
      useTableRows({
        client: runtimeClient as never,
        currentSchemaHash: "schema-1",
        tableName: "users",
        wasmSchema: runtimeSchema as never,
      }),
    );

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.rows).toEqual([]);
  });

  it("keeps the capped row array stable across unrelated renders", () => {
    queryRows = [
      { id: "row-1", name: "Ada" } as DynamicTableRow,
      { id: "row-2", name: "Grace" } as DynamicTableRow,
      { id: "row-3", name: "Linus" } as DynamicTableRow,
    ];
    const { result, rerender } = renderHook(() =>
      useTableRows({
        client: runtimeClient as never,
        currentSchemaHash: "schema-1",
        tableName: "users",
        wasmSchema: runtimeSchema as never,
      }),
    );
    const initialRows = result.current.rows;

    rerender();

    expect(result.current.rows).toBe(initialRows);
  });

  it("keeps resolved rows visible while a new sort subscription resolves", () => {
    queryRows = [
      { id: "row-1", name: "Ada" } as DynamicTableRow,
      { id: "row-2", name: "Grace" } as DynamicTableRow,
    ];
    const { result, rerender } = renderHook(() =>
      useTableRows({
        client: runtimeClient as never,
        currentSchemaHash: "schema-1",
        tableName: "users",
        wasmSchema: runtimeSchema as never,
      }),
    );

    expect(result.current.rows.map((row) => row.id)).toEqual(["row-1", "row-2"]);

    sortColumn = "name";
    sortDirection = "desc";
    queryRows = undefined;
    rerender();

    expect(result.current.rows.map((row) => row.id)).toEqual(["row-1", "row-2"]);
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.page).toBe(1);
  });

  it("does not preserve resolved rows when the Jazz manager is replaced", () => {
    queryRows = [
      { id: "row-1", name: "Ada" } as DynamicTableRow,
      { id: "row-2", name: "Grace" } as DynamicTableRow,
    ];
    const { result, rerender } = renderHook(() =>
      useTableRows({
        client: runtimeClient as never,
        currentSchemaHash: "schema-1",
        tableName: "users",
        wasmSchema: runtimeSchema as never,
      }),
    );

    runtimeClient = { manager: {} };
    queryRows = undefined;
    rerender();

    expect(result.current.rows).toEqual([]);
    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("does not preserve rows from a render that never commits", () => {
    const neverResolves = new Promise<never>(() => undefined);
    let suspend = false;
    queryRows = undefined;
    const { result, rerender } = renderHook(() => {
      const tableRows = useTableRows({
        client: runtimeClient as never,
        currentSchemaHash: "schema-1",
        tableName: "users",
        wasmSchema: runtimeSchema as never,
      });
      if (suspend === true) throw neverResolves;
      return tableRows;
    });

    queryRows = [{ id: "uncommitted-row" } as DynamicTableRow];
    suspend = true;
    rerender();

    queryRows = undefined;
    suspend = false;
    sortColumn = "name";
    rerender();

    expect(result.current.rows).toEqual([]);
    expect(result.current.isInitialLoading).toBe(true);
  });

  it("exposes a failed fresh query without leaving the grid in its loading state", () => {
    queryError = new Error("Unable to load rows");

    const { result } = renderHook(() =>
      useTableRows({
        client: runtimeClient as never,
        currentSchemaHash: "schema-1",
        tableName: "users",
        wasmSchema: runtimeSchema as never,
      }),
    );

    expect(result.current.error).toBe("Unable to load rows");
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.rows).toEqual([]);
  });

  it("does not preserve resolved rows when a sort refresh fails", () => {
    queryRows = [
      { id: "row-1", name: "Ada" } as DynamicTableRow,
      { id: "row-2", name: "Grace" } as DynamicTableRow,
    ];
    const { result, rerender } = renderHook(() =>
      useTableRows({
        client: runtimeClient as never,
        currentSchemaHash: "schema-1",
        tableName: "users",
        wasmSchema: runtimeSchema as never,
      }),
    );

    sortColumn = "name";
    sortDirection = "desc";
    queryRows = undefined;
    queryError = new Error("Unable to sort rows");
    rerender();

    expect(result.current.error).toBe("Unable to sort rows");
    expect(result.current.rows).toEqual([]);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("caps a page at its selected size and exposes next-page availability", () => {
    pageSize = 100;
    queryRows = Array.from({ length: 101 }, (_, index) => ({
      id: `row-${index + 1}`,
    })) as DynamicTableRow[];

    const { result } = renderHook(() =>
      useTableRows({
        client: runtimeClient as never,
        currentSchemaHash: "schema-1",
        tableName: "users",
        wasmSchema: runtimeSchema as never,
      }),
    );

    expect(result.current.rows).toHaveLength(100);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(false);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(100);
  });

  it("navigates between pages and resets the page when page size changes", async () => {
    page = 2;
    queryRows = [{ id: "row-101" } as DynamicTableRow];
    const { result } = renderHook(() =>
      useTableRows({
        client: runtimeClient as never,
        currentSchemaHash: "schema-1",
        tableName: "users",
        wasmSchema: runtimeSchema as never,
      }),
    );

    await result.current.goToPreviousPage();
    await result.current.setPageSize(500);

    expect(setPage).toHaveBeenCalledWith(1);
    expect(setPageSize).toHaveBeenCalledWith(500);
    expect(result.current.hasPreviousPage).toBe(true);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("returns an empty out-of-range page to the first page", async () => {
    page = 2;
    queryRows = [];

    renderHook(() =>
      useTableRows({
        client: runtimeClient as never,
        currentSchemaHash: "schema-1",
        tableName: "users",
        wasmSchema: runtimeSchema as never,
      }),
    );

    await waitFor(() => {
      expect(setPage).toHaveBeenCalledWith(1);
    });
  });
});
