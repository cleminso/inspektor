import { useState } from "react";

import type { ColumnDescriptor } from "jazz-tools";

import { Box, Button, Switch, Text } from "@inspector/ds";

import {
  RowEditorFields,
  useRowEditorFields,
} from "@tables/rowEditor/editorFields";
import { ROW_EDITOR_FORM_ID } from "@tables/rowEditor/editorForm";

interface InsertRowFormProps {
  onCancel?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSave: (
    values: Record<string, unknown>,
    options?: { keepOpen: boolean },
  ) => Promise<void> | void;
  rowValues: Record<string, unknown>;
  schemaColumns: ColumnDescriptor[];
}

interface InsertRowFormFieldsProps extends InsertRowFormProps {
  insertMoreEnabled: boolean;
  onInsertMoreEnabledChange: (enabled: boolean) => void;
  onKeepOpenInsert: () => void;
}

function InsertRowFormFields({
  insertMoreEnabled,
  onCancel,
  onInsertMoreEnabledChange,
  onKeepOpenInsert,
  onDirtyChange,
  onSave,
  rowValues,
  schemaColumns,
}: InsertRowFormFieldsProps): React.ReactElement {
  const insertMoreFieldId = "insert-more";

  const rowEditor = useRowEditorFields({
    initialRowValues: rowValues,
    mode: "insert",
    onDirtyChange,
    onSubmit: async (values) => {
      await onSave(values, { keepOpen: insertMoreEnabled === true });

      if (insertMoreEnabled === true) {
        onKeepOpenInsert();
      }
    },
    schemaColumns,
  });

  return (
    <form
      id={ROW_EDITOR_FORM_ID}
      className="flex h-full min-h-0 flex-col overflow-hidden"
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
        py="m"
      >
        <RowEditorFields
          errors={rowEditor.errors}
          expandedColumnName={rowEditor.expandedColumnName}
          fieldStates={rowEditor.fieldStates}
          formFields={rowEditor.formFields}
          initialRowValues={rowValues}
          mode="insert"
          onFieldExpandedChange={rowEditor.setFieldExpanded}
          onFieldNullChange={rowEditor.setFieldNull}
          onFieldOmittedChange={rowEditor.setFieldOmitted}
          onFieldTextChange={rowEditor.setFieldText}
        />
        {rowEditor.saveError !== null ? (
          <Text color="error" role="alert">
            {rowEditor.saveError}
          </Text>
        ) : null}
      </Box>

      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-t border-border bg-background px-3">
        <label
          htmlFor={insertMoreFieldId}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Switch
            id={insertMoreFieldId}
            aria-labelledby={`${insertMoreFieldId}-label`}
            checked={insertMoreEnabled}
            nativeButton={true}
            render={<button type="button" />}
            onCheckedChange={(nextChecked) => {
              onInsertMoreEnabledChange(nextChecked === true);
            }}
            disabled={rowEditor.isSaving === true}
          />
          <span id={`${insertMoreFieldId}-label`}>Insert more</span>
        </label>
        <div className="flex items-center gap-2">
          {onCancel !== undefined ? (
            <Button
              type="button"
              variant="ghost"
              size="s"
              onClick={onCancel}
              disabled={rowEditor.isSaving === true}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" variant="primary" size="s" loading={rowEditor.isSaving === true}>
            Insert
          </Button>
        </div>
      </div>
    </form>
  );
}

export function InsertRowForm({
  onCancel,
  onDirtyChange,
  onSave,
  rowValues,
  schemaColumns,
}: InsertRowFormProps): React.ReactElement {
  const [insertMoreEnabled, setInsertMoreEnabled] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  return (
    <InsertRowFormFields
      key={formVersion}
      insertMoreEnabled={insertMoreEnabled}
      onInsertMoreEnabledChange={setInsertMoreEnabled}
      onKeepOpenInsert={() => {
        setFormVersion((currentVersion) => currentVersion + 1);
      }}
      onCancel={onCancel}
      onDirtyChange={onDirtyChange}
      onSave={onSave}
      rowValues={rowValues}
      schemaColumns={schemaColumns}
    />
  );
}
