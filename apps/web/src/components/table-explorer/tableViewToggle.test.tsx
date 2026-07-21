import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TableViewToggle } from "./tableViewToggle";

const setView = vi.fn();

vi.mock("@/hooks/useTableExplorerSearchParams", () => ({
  useTableExplorerSearchParams: () => ({ setView, view: "data" }),
}));

afterEach(() => {
  cleanup();
  setView.mockClear();
});

describe("TableViewToggle", () => {
  it("changes the table explorer view from the side-panel footer", () => {
    render(<TableViewToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Schema" }));

    expect(setView).toHaveBeenCalledWith("schema");
  });

  it("keeps the toggle interactive on the new-view surface", () => {
    render(<TableViewToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Schema" }));

    expect(screen.getByRole("group", { name: "Table view" })).toBeTruthy();
    expect(setView).toHaveBeenCalledWith("schema");
  });
});
