import { useState } from 'react'

import type { ColumnDescriptor } from 'jazz-tools'

import { Box, Button, ScrollArea, Text } from '@inspector/ds'

import { RowEditorFields, useRowEditorFields } from '@tables/rowEditor/editorFields'
import { ROW_EDITOR_FORM_ID } from '@tables/rowEditor/editorForm'

interface InsertRowFormProps {
  insertMoreEnabled?: boolean
  onCancel?: () => void
  onDirtyChange?: (isDirty: boolean) => void
  onSave: (values: Record<string, unknown>, options?: { keepOpen: boolean }) => Promise<void> | void
  rowValues: Record<string, unknown>
  saveDisabled?: boolean
  schemaColumns: ColumnDescriptor[]
}

interface InsertRowFormFieldsProps extends InsertRowFormProps {
  insertMoreEnabled: boolean
  onKeepOpenInsert: () => void
}

function InsertRowFormFields({
  insertMoreEnabled,
  onCancel,
  onKeepOpenInsert,
  onDirtyChange,
  onSave,
  rowValues,
  saveDisabled,
  schemaColumns,
}: InsertRowFormFieldsProps): React.ReactElement {
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
      onSubmit={(event) => {
        if (saveDisabled === true) {
          event.preventDefault()
          return
        }
        rowEditor.submit(event)
      }}
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
        {onCancel !== undefined ? (
          <Box flex={1}>
            <Button
              type="button"
              variant="ghost"
              size="s"
              layout="fill"
              onClick={onCancel}
              disabled={rowEditor.isSaving === true}
            >
              Cancel
            </Button>
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}

export function InsertRowForm({
  insertMoreEnabled = false,
  onCancel,
  onDirtyChange,
  onSave,
  rowValues,
  saveDisabled = false,
  schemaColumns,
}: InsertRowFormProps): React.ReactElement {
  const [formVersion, setFormVersion] = useState(0)

  return (
    <InsertRowFormFields
      key={formVersion}
      insertMoreEnabled={insertMoreEnabled}
      onKeepOpenInsert={() => {
        setFormVersion((currentVersion) => currentVersion + 1)
      }}
      onCancel={onCancel}
      onDirtyChange={onDirtyChange}
      onSave={onSave}
      rowValues={rowValues}
      saveDisabled={saveDisabled}
      schemaColumns={schemaColumns}
    />
  )
}
