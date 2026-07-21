import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTableExplorerSearchParams } from "@/hooks/useTableExplorerSearchParams";

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

    expect(useNavigateMock).toHaveBeenCalledWith();
  });

  it("preserves the tab param when switching to schema view from the new-view surface", async () => {
    searchState.value = { tab: "new-view" };
    const { result } = renderHook(() => useTableExplorerSearchParams());

    await act(async () => {
      await result.current.setView("schema");
    });

    const nextSearch = captureSearchUpdater()({ tab: "new-view" });

    expect(nextSearch).toMatchObject({ tab: "new-view", view: "schema" });
  });

  it("strips default view value when returning to data", async () => {
    searchState.value = { tab: "table:accounts", view: "schema" };
    const { result } = renderHook(() => useTableExplorerSearchParams());

    await act(async () => {
      await result.current.setView("data");
    });

    const nextSearch = captureSearchUpdater()({ tab: "table:accounts", view: "schema" });

    expect(nextSearch).toMatchObject({ tab: "table:accounts" });
    expect(nextSearch.view).toBeUndefined();
  });

  it("preserves unrelated search params when updating filters", async () => {
    searchState.value = { tab: "new-view", custom: "kept" };
    const { result } = renderHook(() => useTableExplorerSearchParams());

    await act(async () => {
      await result.current.setFilters([{ column: "id", operator: "eq", value: "1" }]);
    });

    const nextSearch = captureSearchUpdater()({ tab: "new-view", custom: "kept" });

    expect(nextSearch).toMatchObject({ tab: "new-view", custom: "kept" });
  });
});
