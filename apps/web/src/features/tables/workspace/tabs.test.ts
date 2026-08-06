import { beforeEach, describe, expect, it } from "vitest";

import {
  NEW_VIEW_TAB_ID,
  closeTableTab,
  createBaseTableTabId,
  createTableTabRouteSearch,
  loadTableTabsState,
  openBaseTableTabs,
  openNewViewTab,
  recordRecentTableView,
  reconcileTableTab,
  reorderTableTabs,
  replaceNewViewTab,
  saveTableTabsState,
  type TableDataTab,
  type TableTab,
} from "@tables/workspace/tabs";

describe("table tabs", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        key: (index: number) => [...values.keys()][index] ?? null,
        get length() {
          return values.size;
        },
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      } satisfies Storage,
    });
  });

  it("uses one deterministic base tab per table", () => {
    expect(createBaseTableTabId("better_auth_account")).toBe("table:better_auth_account");
  });

  it("keeps internal tab identity out of route search parameters", () => {
    expect(
      createTableTabRouteSearch({
        kind: "table",
        id: "view:accounts-filtered",
        tableName: "accounts",
        search: { filters: "active-filter", sort: "createdAt", dir: "desc" },
      }),
    ).toEqual({ filters: "active-filter", sort: "createdAt", dir: "desc" });
    expect(createTableTabRouteSearch({ kind: "newView", id: NEW_VIEW_TAB_ID })).toEqual({
      empty: "true",
    });
  });

  it("opens missing base tabs without duplicating existing tabs", () => {
    const existingTab: TableTab = {
      kind: "table",
      id: "table:accounts",
      tableName: "accounts",
      search: { sort: "name" },
    };

    expect(openBaseTableTabs([existingTab], ["accounts", "sessions", "users"])).toEqual({
      activeTabId: "table:users",
      tabs: [
        existingTab,
        { kind: "table", id: "table:sessions", tableName: "sessions", search: {} },
        { kind: "table", id: "table:users", tableName: "users", search: {} },
      ],
    });
  });

  it("keeps filtered route state separate from the base table tab", () => {
    const tabs: TableTab[] = [
      {
        kind: "table",
        id: "table:accounts",
        tableName: "accounts",
        search: {},
      },
    ];

    const result = reconcileTableTab({
      activeTabId: "table:accounts",
      createId: () => "accounts-filtered",
      search: { filters: "active-filter", sort: "createdAt", dir: "desc" },
      tableName: "accounts",
      tabs,
    });

    expect(result.activeTabId).toBe("view:accounts-filtered");
    expect(result.tabs).toHaveLength(2);
    expect(result.tabs[1]?.kind === "table" ? result.tabs[1].search : null).toEqual({
      filters: "active-filter",
      sort: "createdAt",
      dir: "desc",
    });
  });

  it("stores pagination on the existing table view instead of creating another tab", () => {
    const baseTab: TableDataTab = {
      kind: "table",
      id: "table:accounts",
      tableName: "accounts",
      search: {},
    };

    const result = reconcileTableTab({
      activeTabId: baseTab.id,
      createId: () => "unused-view",
      search: { page: 2, pageSize: 500 },
      tableName: "accounts",
      tabs: [baseTab],
    });

    expect(result).toEqual({
      activeTabId: "table:accounts",
      tabs: [
        {
          ...baseTab,
          search: { page: 2, pageSize: 500 },
        },
      ],
    });
  });

  it("opens schema in a separate tab while preserving the base data tab", () => {
    const baseTab: TableDataTab = {
      kind: "table",
      id: "table:accounts",
      tableName: "accounts",
      search: {},
    };

    const result = reconcileTableTab({
      activeTabId: baseTab.id,
      createId: () => "accounts-schema",
      search: { view: "schema" },
      tableName: "accounts",
      tabs: [baseTab],
    });

    expect(result).toEqual({
      activeTabId: "view:accounts-schema",
      tabs: [
        baseTab,
        {
          kind: "table",
          id: "view:accounts-schema",
          tableName: "accounts",
          search: { view: "schema" },
        },
      ],
    });
  });

  it("updates the active filtered tab when its route search changes", () => {
    const tabs: TableTab[] = [
      { kind: "table", id: "table:accounts", tableName: "accounts", search: {} },
      {
        kind: "table",
        id: "view:accounts-filtered",
        tableName: "accounts",
        search: { filters: "active-filter" },
      },
    ];

    const result = reconcileTableTab({
      activeTabId: "view:accounts-filtered",
      createId: () => "unused",
      search: { filters: "active-filter", sort: "createdAt", dir: "desc" },
      tableName: "accounts",
      tabs,
    });

    expect(result.activeTabId).toBe("view:accounts-filtered");
    expect(result.tabs).toHaveLength(2);
    expect(result.tabs[1]).toEqual({
      kind: "table",
      id: "view:accounts-filtered",
      tableName: "accounts",
      search: { filters: "active-filter", sort: "createdAt", dir: "desc" },
    });
  });

  it("selects the tab to the right when the active tab closes", () => {
    const tabs: TableTab[] = [
      { kind: "table", id: "one", tableName: "accounts", search: {} },
      { kind: "table", id: "two", tableName: "users", search: {} },
      { kind: "table", id: "three", tableName: "sessions", search: {} },
    ];

    expect(closeTableTab(tabs, "two")).toEqual({
      tabs: [tabs[0], tabs[2]],
      nextActiveTab: tabs[2],
    });
  });

  it("reorders existing tabs from a complete id permutation", () => {
    const tabs: TableTab[] = [
      { kind: "table", id: "one", tableName: "accounts", search: {} },
      { kind: "table", id: "two", tableName: "users", search: {} },
      { kind: "table", id: "three", tableName: "sessions", search: {} },
    ];

    expect(reorderTableTabs(tabs, ["three", "one", "two"])).toEqual([tabs[2], tabs[0], tabs[1]]);
    expect(reorderTableTabs(tabs, ["three", "one"])).toEqual(tabs);
  });

  it("replaces the final closed tab with the default new view", () => {
    expect(
      closeTableTab(
        [{ kind: "table", id: "table:accounts", tableName: "accounts", search: {} }],
        "table:accounts",
      ),
    ).toEqual({
      tabs: [{ kind: "newView", id: NEW_VIEW_TAB_ID }],
      nextActiveTab: { kind: "newView", id: NEW_VIEW_TAB_ID },
    });
  });

  it("keeps one new-view placeholder tab", () => {
    const firstResult = openNewViewTab([]);
    const secondResult = openNewViewTab(firstResult.tabs);

    expect(firstResult.activeTabId).toBe(NEW_VIEW_TAB_ID);
    expect(secondResult.tabs).toEqual(firstResult.tabs);
  });

  it("replaces the new-view placeholder with a selected table view", () => {
    const newViewTabs = openNewViewTab([]).tabs;
    const selectedView = {
      kind: "table" as const,
      id: "table:accounts",
      tableName: "accounts",
      search: {},
    };

    expect(replaceNewViewTab(newViewTabs, selectedView)).toEqual([selectedView]);
  });

  it("keeps five distinct recent table view configurations", () => {
    const views: TableDataTab[] = Array.from({ length: 6 }, (_, index) => ({
      kind: "table" as const,
      id: `view:${index}`,
      tableName: "accounts",
      search: { filters: `filter-${index}` },
    }));
    const recentViews = views.reduce(
      (currentViews, view) => recordRecentTableView(currentViews, view),
      [] as TableDataTab[],
    );

    expect(recentViews).toEqual([...views].reverse().slice(0, 5));
    expect(recordRecentTableView(recentViews, views[5]!)).toEqual(recentViews);
  });

  it("migrates stored table tabs into the view-aware storage shape", () => {
    window.localStorage.setItem(
      "regarde-inspector-tabs",
      JSON.stringify({
        version: 1,
        scopes: {
          inspector: [{ id: "table:accounts", tableName: "accounts", search: {} }],
        },
      }),
    );

    expect(loadTableTabsState("inspector")).toEqual({
      tabs: [
        {
          kind: "table",
          id: "table:accounts",
          tableName: "accounts",
          search: {},
        },
      ],
      recentViews: [],
    });
  });

  it("keeps in-memory tabs usable when storage persistence fails", () => {
    Object.defineProperty(window.localStorage, "setItem", {
      configurable: true,
      value: () => {
        throw new DOMException("Storage is unavailable", "SecurityError");
      },
    });

    expect(() =>
      saveTableTabsState("inspector", {
        tabs: [{ kind: "newView", id: NEW_VIEW_TAB_ID }],
        recentViews: [],
      }),
    ).not.toThrow();
  });
});
