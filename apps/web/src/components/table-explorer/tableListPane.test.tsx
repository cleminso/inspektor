import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TableListPane } from "./tableListPane";

vi.mock("@/components/providers/inspectorProvider", () => ({
  useInspector: () => ({
    currentBranch: null,
    currentConnectionId: null,
    currentSchemaHash: null,
  }),
}));

vi.mock("@/components/table-explorer/tableViewToggle", () => ({
  TableViewToggle: () => null,
}));

vi.mock("@/components/table-explorer/tableTabsProvider", () => ({
  useTableTabs: () => ({
    getBaseTabSearch: () => ({}),
  }),
}));

afterEach(cleanup);

describe("TableListPane", () => {
  it("delegates bulk table selection to the consumer", () => {
    const onTableCheckedChange = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set()}
        searchValue=""
        selectedTableName={null}
        tables={["accounts"]}
        onClearSelection={vi.fn()}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={onTableCheckedChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select accounts" }));

    expect(onTableCheckedChange).toHaveBeenCalledWith("accounts", true, {
      extendRange: false,
      orderedTableNames: ["accounts"],
    });
  });

  it("delegates Shift selection with the visible table order", () => {
    const onTableCheckedChange = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set(["accounts"])}
        searchValue=""
        selectedTableName={null}
        tables={["accounts", "sessions", "users"]}
        onClearSelection={vi.fn()}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={onTableCheckedChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select users" }), {
      shiftKey: true,
    });

    expect(onTableCheckedChange).toHaveBeenCalledWith("users", true, {
      extendRange: true,
      orderedTableNames: ["accounts", "sessions", "users"],
    });
  });

  it("clears a non-empty selection with Escape from the list", () => {
    const onClearSelection = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set(["accounts"])}
        searchValue=""
        selectedTableName={null}
        tables={["accounts"]}
        onClearSelection={onClearSelection}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByRole("checkbox", { name: "Select accounts" }), {
      key: "Escape",
    });

    expect(onClearSelection).toHaveBeenCalledOnce();
  });

  it("does not clear selection when Escape originates from search", () => {
    const onClearSelection = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set(["accounts"])}
        searchValue="accounts"
        selectedTableName={null}
        tables={["accounts"]}
        onClearSelection={onClearSelection}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByRole("searchbox", { name: "Search tables" }), {
      key: "Escape",
    });

    expect(onClearSelection).not.toHaveBeenCalled();
  });

  it("ignores Escape when no tables are checked", () => {
    const onClearSelection = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set()}
        searchValue=""
        selectedTableName={null}
        tables={["accounts"]}
        onClearSelection={onClearSelection}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByRole("checkbox", { name: "Select accounts" }), {
      key: "Escape",
    });

    expect(onClearSelection).not.toHaveBeenCalled();
  });
});
