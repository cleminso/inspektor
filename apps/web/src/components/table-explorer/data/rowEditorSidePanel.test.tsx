import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ROW_EDITOR_FORM_ID } from "@/components/table-explorer/data/rowEditorForm";
import { RowEditorSidePanel } from "@/components/table-explorer/data/rowEditorSidePanel";

afterEach(cleanup);

describe("RowEditorSidePanel dirty transitions", () => {
  it("renders compact selected-row navigation icons", () => {
    render(
      <RowEditorSidePanel
        activeRowIndex={0}
        draftTransitionPending={false}
        draftTransitionSaving={false}
        editedRowIds={["row-1", "row-2"]}
        mode="edit"
        onDiscardAndContinue={() => undefined}
        onKeepEditing={() => undefined}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    );

    for (const name of ["Previous selected row", "Next selected row"]) {
      const icon = screen.getByRole("button", { name }).querySelector("svg");
      expect(icon?.getAttribute("width")).toBe("14");
      expect(icon?.getAttribute("height")).toBe("14");
    }
  });

  it("offers save, discard, and keep-editing decisions", () => {
    const onDiscardAndContinue = vi.fn();
    const onKeepEditing = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <RowEditorSidePanel
        activeRowIndex={0}
        draftTransitionPending={true}
        draftTransitionSaving={false}
        editedRowIds={["row-1"]}
        mode="edit"
        onDiscardAndContinue={onDiscardAndContinue}
        onKeepEditing={onKeepEditing}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <form id={ROW_EDITOR_FORM_ID} onSubmit={onSubmit} />
      </RowEditorSidePanel>,
    );

    expect(screen.getByRole("alertdialog", { name: "Unsaved row changes" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard and continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));

    expect(onKeepEditing).toHaveBeenCalledOnce();
    expect(onDiscardAndContinue).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("disables every transition decision while a mutation is pending", () => {
    render(
      <RowEditorSidePanel
        activeRowIndex={0}
        draftTransitionPending={true}
        draftTransitionSaving={true}
        editedRowIds={["row-1"]}
        mode="edit"
        onDiscardAndContinue={() => undefined}
        onKeepEditing={() => undefined}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <form id={ROW_EDITOR_FORM_ID} />
      </RowEditorSidePanel>,
    );

    expect(screen.getByRole("button", { name: "Keep editing" }).hasAttribute("data-disabled")).toBe(
      true,
    );
    expect(
      screen.getByRole("button", { name: "Discard and continue" }).hasAttribute("data-disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Save and continue" }).hasAttribute("data-disabled"),
    ).toBe(true);
  });
});
