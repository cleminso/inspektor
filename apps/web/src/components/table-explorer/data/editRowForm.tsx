import { useEffect, useState } from "react";

import type { ColumnDescriptor } from "jazz-tools";

import { Button, Text } from "@inspector/ds";

import {
  RowEditorFields,
  useRowEditorFields,
} from "@/components/table-explorer/data/rowEditorFields";

interface EditRowFormProps {
  focusedFieldName?: string | null;
  onCancel?: () => void;
  onDelete?: () => Promise<void> | void;
  onSave: (values: Record<string, unknown>) => Promise<void> | void;
  rowValues: Record<string, unknown> | null;
  schemaColumns: ColumnDescriptor[];
  targetRowId: string | null;
}

const ROW_EDITOR_FOCUSABLE_SELECTOR = [
  "input:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function focusRowEditorField(fieldName: string): boolean {
  const field = document.getElementById(`row-editor-field-${fieldName}`);
  const control = field?.querySelector<HTMLElement>(ROW_EDITOR_FOCUSABLE_SELECTOR) ?? null;

  if (control === null) {
    return false;
  }

  control.focus();
  return true;
}

export function EditRowForm({
  focusedFieldName = null,
  onCancel,
  onDelete,
  onSave,
  rowValues,
  schemaColumns,
  targetRowId,
}: EditRowFormProps): React.ReactElement {
  if (rowValues === null) {
    return <Text color="muted">Select a row from the data table to edit it.</Text>;
  }

  return (
    <LoadedEditRowForm
      key={targetRowId ?? "unknown-row"}
      focusedFieldName={focusedFieldName}
      onCancel={onCancel}
      onDelete={onDelete}
      onSave={onSave}
      rowValues={rowValues}
      schemaColumns={schemaColumns}
      targetRowId={targetRowId}
    />
  );
}

interface LoadedEditRowFormProps extends Omit<EditRowFormProps, "rowValues"> {
  rowValues: Record<string, unknown>;
}

function LoadedEditRowForm({
  focusedFieldName,
  onCancel,
  onDelete,
  onSave,
  rowValues,
  schemaColumns,
}: LoadedEditRowFormProps): React.ReactElement {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const rowEditor = useRowEditorFields({
    initialRowValues: rowValues,
    mode: "edit",
    onSubmit: onSave,
    schemaColumns,
  });

  useEffect(() => {
    if (focusedFieldName === null || focusedFieldName === undefined) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      focusRowEditorField(focusedFieldName);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [focusedFieldName]);

  return (
    <form className="flex h-full min-h-0 flex-col mt-2 overflow-hidden" onSubmit={rowEditor.submit}>
      <div className="app-scrollbar flex min-h-0 flex-1 flex-col gap-4 px-2 mb-2 overflow-auto">
        <RowEditorFields
          errors={rowEditor.errors}
          fieldStates={rowEditor.fieldStates}
          formFields={rowEditor.formFields}
          initialRowValues={rowValues}
          mode="edit"
          onFieldNullChange={rowEditor.setFieldNull}
          onFieldTextChange={rowEditor.setFieldText}
        />

        {rowEditor.saveError !== null ? <Text color="error">{rowEditor.saveError}</Text> : null}
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-t border-border bg-background px-3">
        {onDelete !== undefined ? (
          <Button
            type="button"
            variant="danger"
            size="s"
            disabled={isDeleting === true || rowEditor.isSaving === true}
            onClick={async () => {
              if (isDeleteConfirming === false) {
                setIsDeleteConfirming(true);
                return;
              }

              try {
                setIsDeleting(true);
                await onDelete();
              } finally {
                setIsDeleting(false);
                setIsDeleteConfirming(false);
              }
            }}
          >
            {isDeleting === true
              ? "Deleting..."
              : isDeleteConfirming === true
                ? "Confirm delete"
                : "Delete"}
          </Button>
        ) : null}
        <div
          className={
            onDelete === undefined ? "ml-auto flex items-center gap-2" : "flex items-center gap-2"
          }
        >
          {onCancel !== undefined ? (
            <Button
              type="button"
              variant="ghost"
              size="s"
              onClick={() => {
                if (isDeleteConfirming === true) {
                  setIsDeleteConfirming(false);
                  return;
                }

                onCancel();
              }}
              disabled={rowEditor.isSaving === true}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" variant="primary" size="s" loading={rowEditor.isSaving === true}>
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
