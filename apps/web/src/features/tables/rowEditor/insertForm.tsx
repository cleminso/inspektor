import { useState } from 'react'

import type { ColumnDescriptor } from 'jazz-tools'

import { Box, Button, ScrollArea, Switch, Text } from '@inspector/ds'

import { RowEditorFields, useRowEditorFields } from '@tables/rowEditor/editorFields'
import { ROW_EDITOR_FORM_ID } from '@tables/rowEditor/editorForm'

interface InsertRowFormProps {
  onCancel?: () => void
  onDirtyChange?: (isDirty: boolean) => void
  onSave: (values: Record<string, unknown>, options?: { keepOpen: boolean }) => Promise<void> | void
  rowValues: Record<string, unknown>
  schemaColumns: ColumnDescriptor[]
}

interface InsertRowFormFieldsProps extends InsertRowFormProps {
  insertMoreEnabled: boolean
  onInsertMoreEnabledChange: (enabled: boolean) => void
  onKeepOpenInsert: () => void
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
  const insertMoreFieldId = 'insert-more'

  const rowEditor = useRowEditorFields({
    initialRowValues: rowValues,
    mode: 'insert',
    onDirtyChange,
    onSubmit: async (values) => {
      await onSave(values, { keepOpen: insertMoreEnabled === true })

      if (insertMoreEnabled === true) {
        onKeepOpenInsert()
      }
    },
    schemaColumns,
  })

  return (
    <Box
      as="form"
      id={ROW_EDITOR_FORM_ID}
      height="full"
      minHeight={0}
      flexDirection="column"
      overflow="hidden"
      onSubmit={rowEditor.submit}
    >
      <Box flexGrow={1} mb="m" minHeight={0} overflow="hidden">
        <ScrollArea
          axis={rowEditor.expandedColumnName === null ? 'vertical' : 'none'}
          data-row-editor-scroll-owner={rowEditor.expandedColumnName === null ? 'form' : 'editor'}
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
            {rowEditor.saveError !== null ? (
              <Text color="error" role="alert">
                {rowEditor.saveError}
              </Text>
            ) : null}
          </Box>
        </ScrollArea>
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
        <Box
          as="label"
          htmlFor={insertMoreFieldId}
          display="flex"
          alignItems="center"
          gap="m"
        >
          <Switch
            id={insertMoreFieldId}
            aria-labelledby={`${insertMoreFieldId}-label`}
            checked={insertMoreEnabled}
            nativeButton={true}
            onCheckedChange={(nextChecked) => {
              onInsertMoreEnabledChange(nextChecked === true)
            }}
            disabled={rowEditor.isSaving === true}
          />
          <Text
            as="span"
            id={`${insertMoreFieldId}-label`}
            color="muted"
          >
            Insert more
          </Text>
        </Box>
        <Box
          alignItems="center"
          gap="m"
        >
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
          <Button
            type="submit"
            variant="primary"
            size="s"
            loading={rowEditor.isSaving === true}
          >
            Insert
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export function InsertRowForm({
  onCancel,
  onDirtyChange,
  onSave,
  rowValues,
  schemaColumns,
}: InsertRowFormProps): React.ReactElement {
  const [insertMoreEnabled, setInsertMoreEnabled] = useState(false)
  const [formVersion, setFormVersion] = useState(0)

  return (
    <InsertRowFormFields
      key={formVersion}
      insertMoreEnabled={insertMoreEnabled}
      onInsertMoreEnabledChange={setInsertMoreEnabled}
      onKeepOpenInsert={() => {
        setFormVersion((currentVersion) => currentVersion + 1)
      }}
      onCancel={onCancel}
      onDirtyChange={onDirtyChange}
      onSave={onSave}
      rowValues={rowValues}
      schemaColumns={schemaColumns}
    />
  )
}
