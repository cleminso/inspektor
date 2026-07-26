import { useMemo, useState } from "react";

import type { ColumnDescriptor } from "jazz-tools";

import { Box, Button, CopyButton, JsonView, Search, SegmentedControl, Text } from "@inspector/ds";

import {
  focusRowEditorField,
  RowEditorFields,
  useRowEditorFields,
} from "@/components/table-explorer/data/rowEditorFields";
import {
  createRowJsonViewValue,
  stringifyRowJsonViewValue,
} from "@/components/table-explorer/data/jsonViewValue";

interface EditRowFormProps {
  onCancel?: () => void;
  onDelete?: () => Promise<void> | void;
  onSave: (values: Record<string, unknown>) => Promise<void> | void;
  rowValues: Record<string, unknown> | null;
  schemaColumns: ColumnDescriptor[];
  targetRowId: string | null;
}

export { focusRowEditorField };

export function EditRowForm({
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
      onCancel={onCancel}
      onDelete={onDelete}
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
  const serializedValue = useMemo(() => stringifyRowJsonViewValue(value), [value]);

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
        <CopyButton
          label="Copy row JSON"
          textToCopy={serializedValue}
          tooltipSide="bottom"
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
  onSave,
  rowValues,
  schemaColumns,
}: LoadedEditRowFormProps): React.ReactElement {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [representation, setRepresentation] = useState<RowRepresentation>("details");
  const rowEditor = useRowEditorFields({
    initialRowValues: rowValues,
    mode: "edit",
    onSubmit: onSave,
    schemaColumns,
  });

  return (
    <SegmentedControl
      value={representation}
      onValueChange={(nextRepresentation) => {
        if (nextRepresentation === "details" || nextRepresentation === "json") {
          setRepresentation(nextRepresentation);
        }
      }}
    >
      <div className="px-2 pt-2">
        <SegmentedControl.List
          aria-label="Row representation"
          width="full"
        >
          <SegmentedControl.Item value="details">Details</SegmentedControl.Item>
          <SegmentedControl.Item value="json">JSON</SegmentedControl.Item>
        </SegmentedControl.List>
      </div>
      <SegmentedControl.Panel value="details">
        <form className="flex h-full min-h-0 flex-col mt-2 overflow-hidden" onSubmit={rowEditor.submit}>
          <Box
            data-row-editor-scroll-owner={
              rowEditor.expandedColumnName === null ? "form" : "editor"
            }
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
              onFieldTextChange={rowEditor.setFieldText}
            />

            {rowEditor.saveError !== null ? (
              <Text color="error" role="alert">
                {rowEditor.saveError}
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
      </SegmentedControl.Panel>
      <SegmentedControl.Panel value="json">
        <RowJsonRepresentation rowValues={rowValues} schemaColumns={schemaColumns} />
      </SegmentedControl.Panel>
    </SegmentedControl>
  );
}
