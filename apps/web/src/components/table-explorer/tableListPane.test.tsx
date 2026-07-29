import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TableListPane } from "./tableListPane";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
}));

vi.mock("@/components/providers/inspectorProvider", () => ({
  useInspector: () => ({
    currentBranch: "main",
    currentConnectionId: "connection",
    currentSchemaHash: "schema",
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
  const defaultActionProps = {
    pinnedTableNames: new Set<string>(),
    onOpenTables: vi.fn(),
    onPinTables: vi.fn(),
    onReplaceSelection: vi.fn(),
    onUnpinTables: vi.fn(),
  };

  it("delegates bulk table selection to the consumer", () => {
    const onTableCheckedChange = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
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
      section: "tables",
    });
  });

  it("delegates Shift selection with the visible table order", () => {
    const onTableCheckedChange = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set(["accounts"])}
        {...defaultActionProps}
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
      section: "tables",
    });
  });

  it("keeps table names as links when bulk selection is inactive", () => {
    render(
      <TableListPane
        checkedTableNames={new Set()}
        {...defaultActionProps}
        searchValue=""
        selectedTableName={null}
        tables={["accounts"]}
        onClearSelection={vi.fn()}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "accounts" }).tagName).toBe("A");
  });

  it("uses table names to extend checkbox selection while bulk selection is active", () => {
    const onTableCheckedChange = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set(["accounts"])}
        {...defaultActionProps}
        searchValue=""
        selectedTableName={null}
        tables={["accounts", "sessions", "users"]}
        onClearSelection={vi.fn()}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={onTableCheckedChange}
      />,
    );

    const usersTrigger = screen.getByRole("button", { name: "users" });
    expect(usersTrigger.tagName).toBe("BUTTON");
    fireEvent.click(usersTrigger, { shiftKey: true });

    expect(onTableCheckedChange).toHaveBeenCalledWith("users", true, {
      extendRange: true,
      orderedTableNames: ["accounts", "sessions", "users"],
      section: "tables",
    });
  });

  it("uses a checked table name to deselect that table", () => {
    const onTableCheckedChange = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set(["accounts"])}
        {...defaultActionProps}
        searchValue=""
        selectedTableName={null}
        tables={["accounts", "users"]}
        onClearSelection={vi.fn()}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={onTableCheckedChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "accounts" }));

    expect(onTableCheckedChange).toHaveBeenCalledWith("accounts", false, {
      extendRange: false,
      orderedTableNames: ["accounts", "users"],
      section: "tables",
    });
  });

  it("clears checked tables when clicking outside the table list", () => {
    const onClearSelection = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set(["accounts"])}
        {...defaultActionProps}
        searchValue=""
        selectedTableName={null}
        tables={["accounts", "users"]}
        onClearSelection={onClearSelection}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    fireEvent.pointerDown(document.body);

    expect(onClearSelection).toHaveBeenCalledOnce();
  });

  it("preserves checked tables when clicking another table name", () => {
    const onClearSelection = vi.fn();
    const onTableCheckedChange = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set(["accounts"])}
        {...defaultActionProps}
        searchValue=""
        selectedTableName={null}
        tables={["accounts", "users"]}
        onClearSelection={onClearSelection}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={onTableCheckedChange}
      />,
    );

    const usersTrigger = screen.getByRole("button", { name: "users" });
    fireEvent.pointerDown(usersTrigger);
    fireEvent.click(usersTrigger);

    expect(onClearSelection).not.toHaveBeenCalled();
    expect(onTableCheckedChange).toHaveBeenCalledWith("users", true, {
      extendRange: false,
      orderedTableNames: ["accounts", "users"],
      section: "tables",
    });
  });

  it("clears a non-empty selection with Escape from the list", () => {
    const onClearSelection = vi.fn();

    render(
      <TableListPane
        checkedTableNames={new Set(["accounts"])}
        {...defaultActionProps}
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
        {...defaultActionProps}
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
        {...defaultActionProps}
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

  it("moves pinned tables into a separate section", () => {
    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set()}
        pinnedTableNames={new Set(["users"])}
        searchValue=""
        selectedTableName={null}
        tables={["accounts", "sessions", "users"]}
        onClearSelection={vi.fn()}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /PINNED/ }).textContent).toContain("1");
    expect(screen.getByRole("button", { name: /TABLES/ }).textContent).toContain("2");
    expect(screen.getAllByText("users")).toHaveLength(1);
  });

  it("keeps the pinned and tables sections expanded together", () => {
    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set()}
        pinnedTableNames={new Set(["users"])}
        searchValue=""
        selectedTableName={null}
        tables={["accounts", "users"]}
        onClearSelection={vi.fn()}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    const pinnedTrigger = screen.getByRole("button", { name: /PINNED/ });
    const tablesTrigger = screen.getByRole("button", { name: /TABLES/ });

    fireEvent.click(pinnedTrigger);
    fireEvent.click(pinnedTrigger);

    expect(pinnedTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(tablesTrigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("replaces selection when right-clicking an unselected table", () => {
    const onReplaceSelection = vi.fn();

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(["accounts"])}
        searchValue=""
        selectedTableName={null}
        tables={["accounts", "users"]}
        onClearSelection={vi.fn()}
        onReplaceSelection={onReplaceSelection}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    fireEvent.contextMenu(screen.getByText("users"), { clientX: 40, clientY: 60 });

    expect(onReplaceSelection).toHaveBeenCalledWith("users", "tables");
  });

  it("opens selected table actions when right-clicking its checkbox", () => {
    const onReplaceSelection = vi.fn();

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(["accounts"])}
        searchValue=""
        selectedTableName={null}
        tables={["accounts", "users"]}
        onClearSelection={vi.fn()}
        onReplaceSelection={onReplaceSelection}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    fireEvent.contextMenu(screen.getByRole("checkbox", { name: "Select accounts" }), {
      clientX: 40,
      clientY: 60,
    });

    expect(onReplaceSelection).not.toHaveBeenCalled();
    expect(screen.getByRole("menuitem", { name: "Open 1 table" })).toBeTruthy();
  });

  it("clears checked tables when the context menu is dismissed", () => {
    const onClearSelection = vi.fn();

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(["accounts"])}
        searchValue=""
        selectedTableName={null}
        tables={["accounts"]}
        onClearSelection={onClearSelection}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    fireEvent.contextMenu(screen.getByText("accounts"), { clientX: 40, clientY: 60 });
    fireEvent.pointerDown(document.body);

    expect(onClearSelection).toHaveBeenCalledOnce();
  });

  it("opens all selected tables from the context menu in visible list order", () => {
    const onOpenTables = vi.fn();

    render(
      <TableListPane
        {...defaultActionProps}
        checkedTableNames={new Set(["accounts", "users"])}
        searchValue=""
        selectedTableName={null}
        tables={["accounts", "sessions", "users"]}
        onClearSelection={vi.fn()}
        onOpenTables={onOpenTables}
        onSearchValueChange={vi.fn()}
        onTableCheckedChange={vi.fn()}
      />,
    );

    fireEvent.contextMenu(screen.getByText("accounts"), { clientX: 40, clientY: 60 });
    fireEvent.click(screen.getByRole("menuitem", { name: "Open 2 tables" }));

    expect(onOpenTables).toHaveBeenCalledWith(["accounts", "users"]);
  });
});
