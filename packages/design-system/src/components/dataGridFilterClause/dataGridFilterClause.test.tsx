import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataGridFilterClause } from "./dataGridFilterClause";

afterEach(cleanup);

describe("DataGridFilterClause", () => {
  it("renders one labelled clause trigger with an independent remove action", () => {
    const onRemove = vi.fn();
    render(
      <DataGridFilterClause.Root>
        <DataGridFilterClause.Trigger aria-label="Edit filter name equals Ada">
          <DataGridFilterClause.Column>name</DataGridFilterClause.Column>
          <DataGridFilterClause.Operator>=</DataGridFilterClause.Operator>
          <DataGridFilterClause.Value>Ada</DataGridFilterClause.Value>
        </DataGridFilterClause.Trigger>
        <DataGridFilterClause.Remove aria-label="Remove filter name equals Ada" onClick={onRemove} />
      </DataGridFilterClause.Root>,
    );

    expect(screen.getByRole("button", { name: "Edit filter name equals Ada" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove filter name equals Ada" }));

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("exposes disabled and invalid states with an accessible description", () => {
    render(
      <DataGridFilterClause.Root
        disabled
        invalid
        invalidDescription="Column no longer exists"
      >
        <DataGridFilterClause.Trigger aria-label="Repair invalid filter">
          <DataGridFilterClause.Column>removed</DataGridFilterClause.Column>
        </DataGridFilterClause.Trigger>
      </DataGridFilterClause.Root>,
    );

    const trigger = screen.getByRole("button", { name: "Repair invalid filter" });
    expect(trigger.getAttribute("aria-describedby")).toBe(
      screen.getByText("Column no longer exists").parentElement?.id,
    );
    expect(trigger.hasAttribute("disabled")).toBe(true);
  });
});
