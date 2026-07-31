import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTableExplorerSearchParams } from "@tables/routing/useTableSearchParams";

const { navigateMock, useNavigateMock } = vi.hoisted(() => {
  const navigate = vi.fn();
  return {
    navigateMock: navigate,
    useNavigateMock: vi.fn(() => navigate),
  };
});

vi.mock("@tanstack/react-router", () => ({
  useNavigate: useNavigateMock,
  useSearch: () => searchState.value,
}));

const searchState = {
  value: {} as Record<string, string | null | undefined>,
};

function captureSearchUpdater(): (current: unknown) => Record<string, unknown> {
  const call = navigateMock.mock.calls[0]?.[0] as
    | { search: (current: unknown) => Record<string, unknown> }
    | undefined;
  if (call === undefined || typeof call.search !== "function") {
    throw new Error("navigate was not called with a search updater");
  }
  return call.search;
}

beforeEach(() => {
  searchState.value = {};
  navigateMock.mockReset();
  useNavigateMock.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useTableExplorerSearchParams", () => {
  it("updates search params relative to the active route", () => {
    renderHook(() => useTableExplorerSearchParams());

    expect(useNavigateMock).toHaveBeenCalledWith({
      from: "/conn/$connectionId/tables/$tableName/",
    });
  });

  it("opens schema and removes legacy tab identity", async () => {
    searchState.value = { tab: "new-view" };
    const { result } = renderHook(() => useTableExplorerSearchParams());

    await act(async () => {
      await result.current.openSchema();
    });

    const nextSearch = captureSearchUpdater()({ tab: "new-view" });

    expect(nextSearch).toEqual({ view: "schema" });
  });

  it("returns to the default data view when opening the row editor", async () => {
    searchState.value = { tab: "table:accounts", view: "schema" };
    const { result } = renderHook(() => useTableExplorerSearchParams());

    await act(async () => {
      await result.current.setRowEditor("insert");
    });

    const nextSearch = captureSearchUpdater()({ tab: "table:accounts", view: "schema" });

    expect(nextSearch.tab).toBeUndefined();
    expect(nextSearch.view).toBeUndefined();
  });

  it("preserves unrelated search params when updating filters", async () => {
    searchState.value = { tab: "new-view", custom: "kept" };
    const { result } = renderHook(() => useTableExplorerSearchParams());

    await act(async () => {
      await result.current.setFilters([
        { id: "filter-1", column: "id", operator: "eq", value: "1" },
      ]);
    });

    const nextSearch = captureSearchUpdater()({
      tab: "new-view",
      custom: "kept",
      mode: "edit",
      rowId: "row-1",
    });

    expect(nextSearch).toMatchObject({ custom: "kept" });
    expect(nextSearch.tab).toBeUndefined();
    expect(nextSearch.mode).toBeUndefined();
    expect(nextSearch.rowId).toBeUndefined();
  });
});
