const rowEditorFocusableSelector = [
  "input:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getRowEditorFieldControl(field: HTMLElement): HTMLElement | null {
  if (field.dataset.valueMode === "null") {
    return field.querySelector<HTMLElement>("[data-value-mode-control]");
  }

  return (
    field.querySelector<HTMLElement>("[role='textbox']:not([aria-disabled='true'])") ??
    field.querySelector<HTMLElement>(rowEditorFocusableSelector)
  );
}

/**
 * Finds and focuses a row-editor control from its semantic field identity.
 *
 * This utility deliberately depends only on the rendered field contract. React callers invoke it
 * after the relevant editor is rendered instead of observing the DOM for a future control.
 */
export function focusRowEditorField(fieldName: string): boolean {
  const field = document.getElementById(`row-editor-field-${fieldName}`);
  if (field === null) {
    return false;
  }

  const control = getRowEditorFieldControl(field);
  if (control === null) {
    return false;
  }

  field.scrollIntoView?.({ block: "nearest" });
  control.focus();
  return true;
}
