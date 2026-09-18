/**
 * Connects the surface-independent row draft model to the pane form.
 *
 * This module owns form errors, focus, expanded editors, and duplicate-submit protection. Parsing,
 * dirty comparison and patch construction remain in the shared mutation
 * modules so an inline editor can reuse them without rendering this pane form.
 */
import { useMemo, useRef, useState, type FormEventHandler } from 'react'

import type { ColumnDescriptor } from 'jazz-tools'

import { Box, Field, Input, Text } from '@inspektor/ds'

import { MutationField } from '@tables/rowEditor/mutationField'
import { getMutationFieldInput, type MutationFieldInput } from '@tables/rowEditor/mutation/draft'
import type { RowDraftController } from '@tables/rowEditor/mutation/useRowDraftController'
import type { DetailPaneMode } from '@tables/tableTypes'
import { focusRowEditorField } from '@tables/rowEditor/fieldFocus'
import { getFieldReadOnlyReason } from '@tables/schema/fieldEditability'

interface UseRowEditorFieldsOptions {
  draftController: RowDraftController
  mode: DetailPaneMode
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void
  schemaColumns: ColumnDescriptor[]
}

interface RowEditorFieldsProps {
  errors: Record<string, string>
  expandedColumnName: string | null
  fieldStates: Record<string, MutationFieldInput>
  schemaColumns: ColumnDescriptor[]
  initialRowValues: Record<string, unknown>
  mode: DetailPaneMode
  onFieldExpandedChange: (columnName: string, expanded: boolean) => void
  onFieldInputChange: (columnName: string, input: MutationFieldInput) => void
}

/**
 * Owns one pane form draft from initialization through submission.
 *
 * For edit mode, typing in `name` creates a sparse `name` overlay while every untouched field
 * continues reading from the live row. For insert mode, the hook starts with the complete baseline
 * created by `createInsertRowDraft`. Both modes report one semantic dirty state to the transition
 * guard and send only validated values to `onSubmit`.
 */
export function useRowEditorFields({
  draftController,
  mode,
  onSubmit,
  schemaColumns,
}: UseRowEditorFieldsOptions) {
  const { draft } = draftController.state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedColumnName, setExpandedColumnName] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)
  const fieldStates = useMemo<Record<string, MutationFieldInput>>(
    () =>
      Object.fromEntries(
        schemaColumns.map((column) => [column.name, getMutationFieldInput(draft, column)]),
      ),
    [draft, schemaColumns],
  )

  const setFieldInput = (columnName: string, input: MutationFieldInput) => {
    draftController.actions.setFieldInput(columnName, input)
    if (input.mode === 'null') {
      setExpandedColumnName((currentColumnName) =>
        currentColumnName === columnName ? null : currentColumnName,
      )
    }
    setErrors((currentErrors) => ({ ...currentErrors, [columnName]: '' }))
  }

  const setFieldExpanded = (columnName: string, expanded: boolean) => {
    setExpandedColumnName((currentColumnName) =>
      expanded === true ? columnName : currentColumnName === columnName ? null : currentColumnName,
    )
  }

  const submit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    // React state cannot reject two submit events dispatched before the next render.
    if (isSavingRef.current === true) {
      return
    }
    const submission = draftController.actions.buildSubmission()
    const nextErrors = submission.errors

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      // Collapse expanded editors so the first invalid field can be revealed and focused.
      setExpandedColumnName(null)
      const firstInvalidField = schemaColumns.find(
        (column) => nextErrors[column.name] !== undefined,
      )
      if (firstInvalidField !== undefined) {
        requestAnimationFrame(() => {
          focusRowEditorField(firstInvalidField.name)
        })
      }
      return
    }
    if (mode === 'edit' && Object.keys(submission.values).length === 0) {
      return
    }

    try {
      isSavingRef.current = true
      setIsSaving(true)
      setSaveError(null)
      await onSubmit(submission.values)
    } catch (nextError) {
      setSaveError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }

  return {
    errors,
    expandedColumnName,
    fieldStates,
    isSaving,
    saveError,
    setFieldExpanded,
    setFieldInput,
    submit,
  }
}

/** Renders schema-derived fields from state and actions owned by `useRowEditorFields`. */
export function RowEditorFields({
  errors,
  expandedColumnName,
  fieldStates,
  schemaColumns,
  initialRowValues,
  mode,
  onFieldExpandedChange,
  onFieldInputChange,
}: RowEditorFieldsProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      gap="l"
      minHeight={0}
      pr="xs"
    >
      <Field.Root
        hidden={expandedColumnName !== null}
        id="row-editor-field-id"
      >
        <Box
          alignItems="end"
          data-slot="row-id-field-header"
          gap="m"
          justifyContent="between"
          width="full"
        >
          <Box
            alignItems="center"
            minWidth={0}
          >
            <Field.Label htmlFor="row-editor-id">
              <Text as="span">ID</Text>
            </Field.Label>
          </Box>
          <Text
            as="span"
            color="muted"
            variant="caption"
          >
            UUID
          </Text>
        </Box>
        <Input
          id="row-editor-id"
          font="mono"
          value={mode === 'insert' ? 'auto-generated' : String(initialRowValues.id ?? '')}
          fullWidth
          readOnly
        />
      </Field.Root>

      {schemaColumns.map((column) => {
        const fieldState = fieldStates[column.name]
        if (fieldState === undefined) {
          return null
        }
        const isExpanded = expandedColumnName === column.name
        const readOnlyReason = getFieldReadOnlyReason(column)

        return (
          <MutationField
            column={column}
            error={errors[column.name]}
            expanded={isExpanded}
            input={fieldState}
            hidden={expandedColumnName !== null && isExpanded === false}
            initialValue={initialRowValues[column.name]}
            onExpandedChange={(expanded) => onFieldExpandedChange(column.name, expanded)}
            onInputChange={(input) => onFieldInputChange(column.name, input)}
            canOmit={mode === 'insert' && column.default !== undefined && readOnlyReason === null}
            readOnlyReason={readOnlyReason}
            sourceUnavailable={mode === 'edit' && initialRowValues[column.name] === undefined}
            key={column.name}
          />
        )
      })}
    </Box>
  )
}
