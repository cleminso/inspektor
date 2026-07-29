import { useMemo, useState } from "react";

import type { ColumnDescriptor } from "jazz-tools";

import { Box, Button, JsonView, Search, Text, ToggleGroup } from "@inspector/ds";

import {
  RowEditorFields,
  useRowEditorFields,
} from "@/components/table-explorer/data/rowEditorFields";
import { focusRowEditorField } from "@/components/table-explorer/data/rowEditorFocus";
import { ROW_EDITOR_FORM_ID } from "@/components/table-explorer/data/rowEditorForm";
import {
  createRowJsonViewValue,
} from "@/components/table-explorer/data/jsonViewValue";

interface EditRowFormProps {
  onCancel?: () => void;
  onDelete?: () => Promise<void> | void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSave: (values: Record<string, unknown>) => Promise<void> | void;
  rowValues: Record<string, unknown> | null;
  schemaColumns: ColumnDescriptor[];
  targetRowId: string | null;
}

export { focusRowEditorField };

export function EditRowForm({
  onCancel,
  onDelete,
  onDirtyChange,
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
      onCancel={onCancel}
      onDelete={onDelete}
      onDirtyChange={onDirtyChange}
      onSave={onSave}
      rowValues={rowValues}
      schemaColumns={schemaColumns}
    />
  );
}

interface LoadedEditRowFormProps extends Omit<EditRowFormProps, "rowValues" | "targetRowId"> {
  rowValues: Record<string, unknown>;
}

type RowRepresentation = "details" | "json";

const emptySearchTerms: readonly string[] = [];

function RowJsonRepresentation({
  rowValues,
  schemaColumns,
}: Pick<LoadedEditRowFormProps, "rowValues" | "schemaColumns">): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const value = useMemo(
    () => createRowJsonViewValue(rowValues, schemaColumns),
    [rowValues, schemaColumns],
  );
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 px-2 py-2">
      <div className="flex shrink-0 items-center gap-2">
        <Search
          aria-label="Search row JSON"
          value={searchQuery}
          onValueChange={(nextValue) => {
            setSearchQuery(String(nextValue));
          }}
          size="s"
        />
      </div>
      <div className="app-scrollbar min-h-0 flex-1 overflow-auto">
        <JsonView
          accessibilityLabel="Row JSON"
          data={value}
          searchTerms={searchQuery.length === 0 ? emptySearchTerms : [searchQuery]}
        />
      </div>
    </div>
  );
}

function LoadedEditRowForm({
  onCancel,
  onDelete,
  onDirtyChange,
  onSave,
  rowValues,
  schemaColumns,
}: LoadedEditRowFormProps): React.ReactElement {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [representation, setRepresentation] = useState<RowRepresentation>("details");
  const rowEditor = useRowEditorFields({
    initialRowValues: rowValues,
    mode: "edit",
    onDirtyChange,
    onSubmit: onSave,
    schemaColumns,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-2 pt-2">
        <ToggleGroup<RowRepresentation>
          aria-label="Row representation"
          itemWidth="equal"
          value={[representation]}
          width="full"
          onValueChange={(values) => {
            const nextRepresentation = values[0];
            if (nextRepresentation !== undefined) {
              setRepresentation(nextRepresentation);
            }
          }}
        >
          <ToggleGroup.Item value="details">Details</ToggleGroup.Item>
          <ToggleGroup.Item value="json">JSON</ToggleGroup.Item>
        </ToggleGroup>
      </div>
      {representation === "details" ? (
        <form
          id={ROW_EDITOR_FORM_ID}
          className="flex h-full min-h-0 flex-col mt-2 overflow-hidden"
          onSubmit={rowEditor.submit}
        >
          <Box
            data-row-editor-scroll-owner={rowEditor.expandedColumnName === null ? "form" : "editor"}
            unsafeClassName={rowEditor.expandedColumnName === null ? "app-scrollbar" : undefined}
            flexDirection="column"
            flexGrow={1}
            gap="xl"
            mb="m"
            minHeight={0}
            overflowY={rowEditor.expandedColumnName === null ? "auto" : "hidden"}
            px="m"
          >
            <RowEditorFields
              errors={rowEditor.errors}
              expandedColumnName={rowEditor.expandedColumnName}
              fieldStates={rowEditor.fieldStates}
              formFields={rowEditor.formFields}
              initialRowValues={rowValues}
              mode="edit"
              onFieldExpandedChange={rowEditor.setFieldExpanded}
              onFieldNullChange={rowEditor.setFieldNull}
              onFieldOmittedChange={rowEditor.setFieldOmitted}
              onFieldTextChange={rowEditor.setFieldText}
            />

            {deleteError !== null || rowEditor.saveError !== null ? (
              <Text color="error" role="alert">
                {deleteError ?? rowEditor.saveError}
              </Text>
            ) : null}
          </Box>

          <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-t border-border bg-background px-3">
            {onDelete !== undefined ? (
              <Button
                type="button"
                variant="danger"
                size="s"
                disabled={isDeleting === true || rowEditor.isSaving === true}
                onClick={async () => {
                  if (isDeleteConfirming === false) {
                    setDeleteError(null);
                    setIsDeleteConfirming(true);
                    return;
                  }

                  try {
                    setIsDeleting(true);
                    setDeleteError(null);
                    await onDelete();
                  } catch (nextError) {
                    setDeleteError(
                      nextError instanceof Error ? nextError.message : String(nextError),
                    );
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
                onDelete === undefined
                  ? "ml-auto flex items-center gap-2"
                  : "flex items-center gap-2"
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
                  disabled={rowEditor.isSaving === true || isDeleting === true}
                >
                  Cancel
                </Button>
              ) : null}
              <Button
                type="submit"
                variant="primary"
                size="s"
                loading={rowEditor.isSaving === true}
                disabled={isDeleting === true}
              >
                Save
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <RowJsonRepresentation rowValues={rowValues} schemaColumns={schemaColumns} />
      )}
    </div>
  );
}
