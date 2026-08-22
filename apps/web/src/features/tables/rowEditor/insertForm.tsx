import { useState } from "react";
import type { ColumnDescriptor } from "jazz-tools";

import { Box, Button, ScrollArea, Text } from "@inspector/ds";

import { RowEditorFields, useRowEditorFields } from "@tables/rowEditor/editorFields";
import { useRowDraftController } from "@tables/rowEditor/mutation/useRowDraftController";

interface InsertRowFormProps {
  insertMoreEnabled?: boolean;
  onDiscard?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSave: (
    values: Record<string, unknown>,
    options: { keepOpen: boolean },
  ) => Promise<void> | void;
  rowValues: Record<string, unknown>;
  saveDisabled?: boolean;
  schemaColumns: ColumnDescriptor[];
}

interface InsertRowFormFieldsProps extends InsertRowFormProps {
  insertMoreEnabled: boolean;
  onInserted: () => void;
}

function InsertRowFormFields({
  insertMoreEnabled,
  onDiscard,
  onDirtyChange,
  onInserted,
  onSave,
  rowValues,
  saveDisabled = false,
  schemaColumns,
}: InsertRowFormFieldsProps): React.ReactElement {
  const draftController = useRowDraftController({
    initialRowValues: rowValues,
    mode: "insert",
    schemaColumns,
  });
  const rowEditor = useRowEditorFields({
    draftController,
    mode: "insert",
    onDirtyChange,
    onSubmit: async (values) => {
      await onSave(values, { keepOpen: insertMoreEnabled });
      if (insertMoreEnabled === true) {
        onInserted();
      }
    },
    schemaColumns,
  });

  return (
    <Box
      as="form"
      data-slot="insert-row-form"
      height="full"
      minHeight={0}
      flexDirection="column"
      overflow="hidden"
      onSubmit={(event) => {
        if (saveDisabled === true) {
          event.preventDefault();
          return;
        }
        rowEditor.submit(event);
      }}
    >
      <Box flexGrow={1} mb="m" minHeight={0} overflow="hidden">
        <ScrollArea
          axis={rowEditor.expandedColumnName === null ? "vertical" : "none"}
          data-row-editor-scroll-owner={rowEditor.expandedColumnName === null ? "form" : "editor"}
        >
          <Box flexDirection="column" flexGrow={1} gap="xl" minHeight={0} px="m" py="m">
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
            {rowEditor.saveError === null ? null : (
              <Text color="error" role="alert">
                {rowEditor.saveError}
              </Text>
            )}
          </Box>
        </ScrollArea>
      </Box>

      <Box
        data-slot="row-editor-footer"
        flexShrink={0}
        alignItems="center"
        gap="xs"
        borderTopWidth={1}
        borderColor="default"
        borderStyle="solid"
        backgroundColor="surface-background"
        paddingHorizontal="m"
        paddingVertical="s"
        paddingRight="l"
      >
        <Box flex={1}>
          <Button
            type="submit"
            variant="primary"
            size="s"
            layout="fill"
            loading={rowEditor.isSaving === true}
            disabled={saveDisabled === true}
          >
            Insert
          </Button>
        </Box>
        {onDiscard === undefined ? null : (
          <Box flex={1}>
            <Button
              type="button"
              variant="secondary"
              size="s"
              layout="fill"
              onClick={onDiscard}
              disabled={rowEditor.isSaving === true}
            >
              Discard
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export function InsertRowForm({
  insertMoreEnabled = false,
  ...props
}: InsertRowFormProps): React.ReactElement {
  const [formVersion, setFormVersion] = useState(0);

  return (
    <InsertRowFormFields
      {...props}
      key={formVersion}
      insertMoreEnabled={insertMoreEnabled}
      onInserted={() => {
        setFormVersion((currentVersion) => currentVersion + 1);
      }}
    />
  );
}
