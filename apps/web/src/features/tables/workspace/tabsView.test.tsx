import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TableTabsView } from "@tables/workspace/tabsView";

const mocks = vi.hoisted(() => ({
  activateTab: vi.fn(),
  closeTab: vi.fn(),
  openNewView: vi.fn(),
  reorderTabs: vi.fn(),
  state: {
    activeTabId: null as string | null,
    tabs: [] as Array<
      | { kind: "newView"; id: "new-view" }
      | { kind: "table"; id: string; tableName: string; search: Record<string, string> }
    >,
  },
}));

vi.mock("@tables/workspace/newView", () => ({
  NewTableView: () => <div>New table view content</div>,
}));

vi.mock("@tables/workspace/selectedView", () => ({
  SelectedTableView: ({ tableName }: { tableName: string }) => (
    <div>Selected table: {tableName}</div>
  ),
}));

vi.mock("@tables/workspace/tabsProvider", () => ({
  useTableTabs: () => ({
    activeTabId: mocks.state.activeTabId,
    activateTab: mocks.activateTab,
    closeTab: mocks.closeTab,
    openNewView: mocks.openNewView,
    reorderTabs: mocks.reorderTabs,
    tabs: mocks.state.tabs,
  }),
}));

afterEach(cleanup);

beforeEach(() => {
  mocks.activateTab.mockReset();
  mocks.closeTab.mockReset();
  mocks.openNewView.mockReset();
  mocks.reorderTabs.mockReset();
  mocks.state.activeTabId = null;
  mocks.state.tabs = [];
});

describe("TableTabsView", () => {
  it("keeps the tab bar visible for the fallback new-view surface", () => {
    render(<TableTabsView tableName={null} />);

    const addButton = screen.getByRole("button", { name: "Open new table view" });
    expect(screen.getByRole("tablist", { name: "Open table views" }).parentElement).toBe(
      addButton.parentElement,
    );
    expect(screen.getByText("New table view content")).toBeTruthy();

    fireEvent.click(addButton);
    expect(mocks.openNewView).toHaveBeenCalledOnce();
  });

  it("renders table content only for an active table tab", () => {
    mocks.state.activeTabId = "table:accounts";
    mocks.state.tabs = [
      {
        kind: "table",
        id: "table:accounts",
        tableName: "accounts",
        search: {},
      },
    ];

    render(<TableTabsView tableName="accounts" />);

    expect(screen.getByText("Selected table: accounts")).toBeTruthy();
    expect(screen.queryByText("New table view content")).toBeNull();
  });

  it("does not offer to close the sole new-view tab", () => {
    mocks.state.activeTabId = "new-view";
    mocks.state.tabs = [{ kind: "newView", id: "new-view" }];

    render(<TableTabsView tableName={null} />);

    expect(screen.getByRole("tab", { name: "New view" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close New view" })).toBeNull();
  });
});
