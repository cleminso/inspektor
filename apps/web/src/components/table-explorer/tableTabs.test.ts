import { beforeEach, describe, expect, it } from "vitest";

import {
  NEW_VIEW_TAB_ID,
  closeTableTab,
  createBaseTableTabId,
  loadTableTabsState,
  openBaseTableTabs,
  openNewViewTab,
  recordRecentTableView,
  reconcileTableTab,
  reorderTableTabs,
  replaceNewViewTab,
  saveTableTabsState,
  type TableTab,
} from "@/components/table-explorer/tableTabs";

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

  it("updates an existing tab with the current URL-backed view state", () => {
    const tabs: TableTab[] = [
      {
        kind: "table",
        id: "table:accounts",
        tableName: "accounts",
        search: {},
      },
    ];

    const result = reconcileTableTab({
      createId: () => "unused",
      requestedTabId: "table:accounts",
      search: { filters: "active-filter", sort: "createdAt", dir: "desc" },
      tableName: "accounts",
      tabs,
    });

    expect(result.activeTabId).toBe("table:accounts");
    expect(result.tabs[0]?.search).toEqual({
      filters: "active-filter",
      sort: "createdAt",
      dir: "desc",
    });
  });

  it("creates a separate tab for a filtered relation view", () => {
    const result = reconcileTableTab({
      createId: () => "relation-view",
      requestedTabId: null,
      search: { filters: "relation-filter" },
      tableName: "users",
      tabs: [
        {
          kind: "table",
          id: "table:users",
          tableName: "users",
          search: {},
        },
      ],
    });

    expect(result.activeTabId).toBe("view:relation-view");
    expect(result.tabs).toHaveLength(2);
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

    expect(reorderTableTabs(tabs, ["three", "one", "two"])).toEqual([
      tabs[2],
      tabs[0],
      tabs[1],
    ]);
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
    const views = Array.from({ length: 6 }, (_, index) => ({
      kind: "table" as const,
      id: `view:${index}`,
      tableName: "accounts",
      search: { filters: `filter-${index}` },
    }));
    const recentViews = views.reduce(
      (currentViews, view) => recordRecentTableView(currentViews, view),
      [] as typeof views,
    );

    expect(recentViews).toEqual(views.toReversed().slice(0, 5));
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
