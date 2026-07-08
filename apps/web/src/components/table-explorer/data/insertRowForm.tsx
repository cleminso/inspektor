import { useState } from "react";

import type { ColumnDescriptor } from "jazz-tools";

import { Button } from "@regarde/ui/button";
import { Switch } from "@regarde/ui/switch";

import { RowEditorFields, useRowEditorFields } from "@/components/table-explorer/data/rowEditorFields";

interface InsertRowFormProps {
  onCancel?: () => void;
  onSave: (values: Record<string, unknown>, options?: { keepOpen: boolean }) => Promise<void> | void;
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
  onSave,
  rowValues,
  schemaColumns,
}: InsertRowFormFieldsProps): React.ReactElement {
  const insertMoreFieldId = "insert-more";

  const rowEditor = useRowEditorFields({
    initialRowValues: rowValues,
    mode: "insert",
    onSubmit: async (values) => {
      await onSave(values, { keepOpen: insertMoreEnabled === true });

      if (insertMoreEnabled === true) {
        onKeepOpenInsert();
      }
    },
    schemaColumns,
  });

  return (
    <form className="flex h-full min-h-0 flex-col overflow-hidden" onSubmit={rowEditor.submit}>
      <div className="app-scrollbar flex min-h-0 flex-1 flex-col gap-4 px-2 py-2 mb-2 overflow-auto">
        <RowEditorFields
          errors={rowEditor.errors}
          fieldStates={rowEditor.fieldStates}
          formFields={rowEditor.formFields}
          initialRowValues={rowValues}
          mode="insert"
          onFieldNullChange={rowEditor.setFieldNull}
          onFieldTextChange={rowEditor.setFieldText}
        />
        {rowEditor.saveError !== null ? <p className="text-sm text-destructive">{rowEditor.saveError}</p> : null}
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-t border-border bg-background px-3">
        <label htmlFor={insertMoreFieldId} className="flex items-center gap-2 text-sm text-muted-foreground">
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
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={rowEditor.isSaving === true}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" variant="default" size="sm" loading={rowEditor.isSaving === true}>
            Insert
          </Button>
        </div>
      </div>
    </form>
  );
}

export function InsertRowForm({
  onCancel,
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
      onSave={onSave}
      rowValues={rowValues}
      schemaColumns={schemaColumns}
    />
  );
}
