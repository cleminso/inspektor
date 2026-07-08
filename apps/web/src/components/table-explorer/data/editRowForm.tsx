import { useState } from "react";

import type { ColumnDescriptor } from "jazz-tools";

import { Button } from "@regarde/ui/button";
import { EmptyState } from "@regarde/ui/emptyState";
import { cn } from "@regarde/ui/lib/utils";

import { RowEditorFields, useRowEditorFields } from "@/components/table-explorer/data/rowEditorFields";

interface EditRowFormProps {
  onCancel?: () => void;
  onDelete?: () => Promise<void> | void;
  onSave: (values: Record<string, unknown>) => Promise<void> | void;
  rowValues: Record<string, unknown> | null;
  schemaColumns: ColumnDescriptor[];
  targetRowId: string | null;
}

export function EditRowForm({
  onCancel,
  onDelete,
  onSave,
  rowValues,
  schemaColumns,
  targetRowId,
}: EditRowFormProps): React.ReactElement {
  if (rowValues === null) {
    return <EmptyState title="Select a row" description="Select a row from the data grid to edit it." />;
  }

  return (
    <LoadedEditRowForm
      key={targetRowId ?? "unknown-row"}
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
  onCancel,
  onDelete,
  onSave,
  rowValues,
  schemaColumns,
  targetRowId,
}: LoadedEditRowFormProps): React.ReactElement {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const rowEditor = useRowEditorFields({
    initialRowValues: rowValues,
    mode: "edit",
    onSubmit: onSave,
    schemaColumns,
  });

  return (
    <form className="flex h-full min-h-0 flex-col mt-2 overflow-hidden" onSubmit={rowEditor.submit}>
      <div className="app-scrollbar flex min-h-0 flex-1 flex-col gap-4 px-2 mb-2 overflow-auto">
        <p className="text-sm text-muted-foreground">ID: {targetRowId}</p>

        <RowEditorFields
          errors={rowEditor.errors}
          fieldStates={rowEditor.fieldStates}
          formFields={rowEditor.formFields}
          initialRowValues={rowValues}
          mode="edit"
          onFieldNullChange={rowEditor.setFieldNull}
          onFieldTextChange={rowEditor.setFieldText}
        />

        {rowEditor.saveError !== null ? <p className="text-sm text-destructive">{rowEditor.saveError}</p> : null}
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-t border-border bg-background px-3">
        {onDelete !== undefined ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
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
            {isDeleting === true ? "Deleting..." : isDeleteConfirming === true ? "Confirm delete" : "Delete"}
          </Button>
        ) : null}
        <div className={cn("flex items-center gap-2", onDelete === undefined && "ml-auto")}>
          {onCancel !== undefined ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
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
          <Button type="submit" variant="default" size="sm" loading={rowEditor.isSaving === true}>
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
