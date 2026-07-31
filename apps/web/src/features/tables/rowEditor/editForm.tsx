import { useMemo, useState } from "react";

import type { ColumnDescriptor } from "jazz-tools";

import { Box, Button, JsonView, Search, Text, ToggleGroup } from "@inspector/ds";

import {
  RowEditorFields,
  useRowEditorFields,
} from "@tables/rowEditor/editorFields";
import { focusRowEditorField } from "@tables/rowEditor/fieldFocus";
import { ROW_EDITOR_FORM_ID } from "@tables/rowEditor/editorForm";
import {
  createRowJsonViewValue,
} from "@tables/rowEditor/values/jsonView";

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
    <Box height="full" minHeight={0} flexDirection="column" gap="m" px="m" py="m">
      <Box flexShrink={0} alignItems="center" gap="m">
        <Search
          aria-label="Search row JSON"
          value={searchQuery}
          onValueChange={(nextValue) => {
            setSearchQuery(String(nextValue));
          }}
          size="s"
        />
      </Box>
      <Box unsafeClassName="app-scrollbar" minHeight={0} flex={1} overflow="auto">
        <JsonView
          accessibilityLabel="Row JSON"
          data={value}
          searchTerms={searchQuery.length === 0 ? emptySearchTerms : [searchQuery]}
        />
      </Box>
    </Box>
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
    <Box height="full" minHeight={0} flexDirection="column">
      <Box px="m" pt="m">
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
      </Box>
      {representation === "details" ? (
        <Box
          as="form"
          id={ROW_EDITOR_FORM_ID}
          height="full"
          minHeight={0}
          flexDirection="column"
          mt="m"
          overflow="hidden"
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

          <Box
            height="panel-bar-height"
            flexShrink={0}
            alignItems="center"
            justifyContent="between"
            gap="m"
            borderTopWidth={1}
            borderColor="border"
            borderStyle="solid"
            backgroundColor="bg-page"
            px="l"
          >
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
            <Box ml={onDelete === undefined ? "auto" : "none"} alignItems="center" gap="m">
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
            </Box>
          </Box>
        </Box>
      ) : (
        <RowJsonRepresentation rowValues={rowValues} schemaColumns={schemaColumns} />
      )}
    </Box>
  );
}
