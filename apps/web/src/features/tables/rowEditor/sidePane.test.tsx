import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ROW_EDITOR_FORM_ID } from "@tables/rowEditor/editorForm";
import { RowEditorSidePanel } from "@tables/rowEditor/sidePane";

afterEach(cleanup);

describe("RowEditorSidePanel dirty transitions", () => {
  it("shows the active page row and selected grid column in the edit title", () => {
    render(
      <RowEditorSidePanel
        activeRowIndex={0}
        activePageRowNumber={12}
        activeColumnNumber={3}
        draftTransitionPending={false}
        draftTransitionSaving={false}
        editedRowIds={["row-12"]}
        mode="edit"
        onDiscardAndContinue={() => undefined}
        onKeepEditing={() => undefined}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    );

    expect(screen.getByRole("heading", { name: "Edit row 12:3" })).toBeTruthy();
  });

  it("shows column zero when no grid cell is selected", () => {
    render(
      <RowEditorSidePanel
        activeRowIndex={0}
        activePageRowNumber={1}
        activeColumnNumber={0}
        draftTransitionPending={false}
        draftTransitionSaving={false}
        editedRowIds={["row-1"]}
        mode="edit"
        onDiscardAndContinue={() => undefined}
        onKeepEditing={() => undefined}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    );

    expect(screen.getByRole("heading", { name: "Edit row 1:0" })).toBeTruthy();
  });

  it("omits page coordinates when the edited row is outside the loaded page", () => {
    render(
      <RowEditorSidePanel
        activeRowIndex={0}
        activePageRowNumber={null}
        activeColumnNumber={0}
        draftTransitionPending={false}
        draftTransitionSaving={false}
        editedRowIds={["row-outside-page"]}
        mode="edit"
        onDiscardAndContinue={() => undefined}
        onKeepEditing={() => undefined}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    );

    expect(screen.getByRole("heading", { name: "Edit row" })).toBeTruthy();
  });

  it("renders compact selected-row navigation icons", () => {
    render(
      <RowEditorSidePanel
        activeColumnNumber={0}
        activePageRowNumber={1}
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
      const button = screen.getByRole("button", { name });
      const icon = button.querySelector('[data-slot="icon"]');
      expect(button.getAttribute("data-glyph-size")).toBe("standard");
      expect(icon?.getAttribute("data-size")).toBe("s");
    }
  });

  it("changes whether another row remains open after insertion", () => {
    const onInsertMoreEnabledChange = vi.fn();
    render(
      <RowEditorSidePanel
        activeColumnNumber={0}
        activePageRowNumber={1}
        activeRowIndex={0}
        draftTransitionPending={false}
        draftTransitionSaving={false}
        editedRowIds={[]}
        insertMoreEnabled={false}
        mode="insert"
        onDiscardAndContinue={() => undefined}
        onInsertMoreEnabledChange={onInsertMoreEnabledChange}
        onKeepEditing={() => undefined}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Insert more" }));

    expect(onInsertMoreEnabledChange).toHaveBeenCalledWith(true);
  });

  it("offers save, discard, and keep-editing decisions", () => {
    const onDiscardAndContinue = vi.fn();
    const onKeepEditing = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <RowEditorSidePanel
        activeColumnNumber={0}
        activePageRowNumber={1}
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
        activeColumnNumber={0}
        activePageRowNumber={1}
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
