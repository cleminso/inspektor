import { renderHook } from "@testing-library/react";
import type { DynamicTableRow } from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTableRowById } from "@tables/query/useTableRowById";

const { builderCalls, manager, queryRows, useJazzQueryStateMock } = vi.hoisted(() => ({
  builderCalls: {
    limit: vi.fn(),
    offset: vi.fn(),
    where: vi.fn(),
  },
  manager: {},
  queryRows: { value: undefined as DynamicTableRow[] | undefined },
  useJazzQueryStateMock: vi.fn(() => ({
    status: queryRows.value === undefined ? "pending" : "fulfilled",
    data: queryRows.value,
    error: null,
  })),
}));

let runtimeClient: { manager: Record<string, never> } | null;

vi.mock("@app/providers/inspectorProvider", () => ({
  useRuntimeClient: () => runtimeClient,
  useRuntimeSchema: () => ({}),
}));

vi.mock("@tables/query/genericQueryBuilder", () => ({
  GenericQueryBuilder: class GenericQueryBuilder {
    limit(value: number) {
      builderCalls.limit(value);
      return this;
    }
    offset(value: number) {
      builderCalls.offset(value);
      return this;
    }
    where(value: unknown) {
      builderCalls.where(value);
      return this;
    }
  },
}));

vi.mock("@tables/query/useJazzQueryState", () => ({
  useJazzQueryState: useJazzQueryStateMock,
}));

beforeEach(() => {
  queryRows.value = undefined;
  runtimeClient = { manager };
  builderCalls.limit.mockClear();
  builderCalls.offset.mockClear();
  builderCalls.where.mockClear();
  useJazzQueryStateMock.mockClear();
});

describe("useTableRowById", () => {
  it("loads one row by id outside the visible table query", () => {
    queryRows.value = [{ id: "row-1", name: "Ada" } as DynamicTableRow];

    const { result } = renderHook(() => useTableRowById({ rowId: "row-1", tableName: "users" }));

    expect(result.current).toEqual({ id: "row-1", name: "Ada" });
    expect(builderCalls.where).toHaveBeenCalledWith({ id: "row-1" });
    expect(builderCalls.limit).toHaveBeenCalledWith(1);
    expect(builderCalls.offset).toHaveBeenCalledWith(0);
    expect(useJazzQueryStateMock).toHaveBeenCalledWith(manager, expect.anything(), {
      propagation: "full",
      visibility: "hidden_from_live_query_list",
    });
  });

  it("disables the row query without an active row id", () => {
    queryRows.value = [{ id: "row-1" } as DynamicTableRow];

    const { result } = renderHook(() => useTableRowById({ rowId: null, tableName: "users" }));

    expect(result.current).toBeNull();
    expect(builderCalls.where).not.toHaveBeenCalled();
    expect(useJazzQueryStateMock).toHaveBeenCalledWith(manager, undefined, {
      propagation: "full",
      visibility: "hidden_from_live_query_list",
    });
  });

  it("stays idle without a runtime client provider", () => {
    runtimeClient = null;

    const { result } = renderHook(() => useTableRowById({ rowId: "row-1", tableName: "users" }));

    expect(result.current).toBeNull();
    expect(useJazzQueryStateMock).toHaveBeenCalledWith(null, expect.anything(), {
      propagation: "full",
      visibility: "hidden_from_live_query_list",
    });
  });
});
