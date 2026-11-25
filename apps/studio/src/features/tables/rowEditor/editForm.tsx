import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { ColumnDescriptor } from 'jazz-tools'

import {
  Box,
  FindBar,
  JsonView,
  ScrollArea,
  Text,
  ToggleGroup,
  type FindBarSearchOptions,
  type FindBarState,
  type JsonViewSearchResults,
  type DataGridCellTarget,
} from '@inspektor/ds'

import { RowEditorFields, useRowEditorFields } from '@tables/rowEditor/editorFields'
import { projectDraft, type FieldIntent, type RowDraft } from '@inspektor/core/draft'
import { RowProvenanceFields } from '@tables/rowEditor/provenanceFields'
import { createRowJsonViewValue } from '@tables/rowEditor/values/jsonView'
import { TABLE_PROVENANCE_COLUMNS } from '@tables/tableProvenance'
import { focusRowEditorField } from '@tables/rowEditor/fieldFocus'

interface EditRowFormProps {
  requestedField?: DataGridCellTarget | null
  draft: RowDraft
  onFieldInputChange: (columnName: string, input: FieldIntent) => void
  onSave: () => Promise<void>
  disabled?: boolean
  onRepresentationChange: (representation: RowRepresentation) => void
  representation: RowRepresentation
  rowValues: Record<string, unknown>
  schemaColumns: ColumnDescriptor[]
}

export type RowRepresentation = 'details' | 'json' | 'provenance'

const defaultFindOptions: FindBarSearchOptions = {
  caseSensitive: false,
  wholeWord: false,
  regularExpression: false,
}

function RowJsonRepresentation({
  draft,
  rowValues,
  schemaColumns,
}: Pick<EditRowFormProps, 'draft' | 'rowValues' | 'schemaColumns'>): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOptions, setSearchOptions] = useState(defaultFindOptions)
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<JsonViewSearchResults>({
    activeIndex: null,
    count: 0,
    pending: false,
    query: '',
  })
  const value = useMemo(() => {
    const projection = projectDraft(draft, schemaColumns)
    return createRowJsonViewValue({ ...rowValues, ...projection.displayValues }, [
      ...schemaColumns,
      ...TABLE_PROVENANCE_COLUMNS,
    ])
  }, [draft, rowValues, schemaColumns])
  const findState: FindBarState =
    searchQuery.length === 0
      ? { status: 'idle' }
      : searchResults.query !== searchQuery && searchResults.query.length === 0
        ? { status: 'searching' }
        : searchResults.activeIndex === null
          ? {
              status: 'empty',
              pending: searchResults.query !== searchQuery || searchResults.pending,
            }
          : {
              status: 'matched',
              activeIndex: searchResults.activeIndex,
              count: searchResults.count,
              pending: searchResults.query !== searchQuery || searchResults.pending,
            }
  return (
    <Box
      height="full"
      minHeight={0}
      flexDirection="column"
      gap="m"
      px="m"
      py="m"
      pr="l"
    >
      <Box
        flexShrink={0}
        alignItems="center"
        gap="m"
      >
        <FindBar
          label="Find in row JSON"
          value={searchQuery}
          onValueChange={(nextValue) => {
            setSearchQuery(nextValue)
            setActiveMatchIndex(0)
          }}
          state={findState}
          searchOptions={searchOptions}
          onSearchOptionsChange={(nextOptions) => {
            setSearchOptions(nextOptions)
            setActiveMatchIndex(0)
          }}
          onPreviousMatch={() => {
            setActiveMatchIndex((searchResults.activeIndex ?? 0) - 1)
          }}
          onNextMatch={() => {
            setActiveMatchIndex((searchResults.activeIndex ?? 0) + 1)
          }}
        />
      </Box>
      <ScrollArea>
        <JsonView
          accessibilityLabel="Row JSON"
          data={value}
          search={{
            query: searchQuery,
            ...searchOptions,
            activeMatchIndex,
            onResultsChange: setSearchResults,
          }}
        />
      </ScrollArea>
    </Box>
  )
}

function RowProvenanceRepresentation({
  rowValues,
}: Pick<EditRowFormProps, 'rowValues'>): React.ReactElement {
  return (
    <Box
      height="full"
      minHeight={0}
      px="m"
      py="m"
      pr="l"
    >
      <ScrollArea>
        <RowProvenanceFields rowValues={rowValues} />
      </ScrollArea>
    </Box>
  )
}

export function EditRowForm({
  requestedField = null,
  draft,
  onFieldInputChange,
  onRepresentationChange,
  onSave,
  disabled = false,
  representation,
  rowValues,
  schemaColumns,
}: EditRowFormProps): React.ReactElement {
  const rowEditor = useRowEditorFields({
    draft,
    onFieldInputChange,
    mode: 'edit',
    onSubmit: onSave,
    onValidationFailure: () => onRepresentationChange('details'),
    schemaColumns,
  })
  const handledFieldRequest = useRef<DataGridCellTarget | null>(null)
  const { expandedColumnName, isSaving, setFieldExpanded } = rowEditor
  useLayoutEffect(() => {
    if (
      requestedField === null ||
      handledFieldRequest.current === requestedField ||
      requestedField.rowId !== String(rowValues.id) ||
      disabled === true ||
      isSaving === true
    )
      return
    const requestedRepresentation = TABLE_PROVENANCE_COLUMNS.some(
      (column) => column.name === requestedField.columnId,
    )
      ? 'provenance'
      : 'details'
    if (representation !== requestedRepresentation) {
      onRepresentationChange(requestedRepresentation)
      return
    }
    if (
      requestedRepresentation === 'details' &&
      expandedColumnName !== null &&
      expandedColumnName !== requestedField.columnId
    ) {
      setFieldExpanded(expandedColumnName, false)
      return
    }
    if (focusRowEditorField(requestedField.columnId) === true) {
      handledFieldRequest.current = requestedField
    }
  }, [
    disabled,
    expandedColumnName,
    isSaving,
    onRepresentationChange,
    representation,
    requestedField,
    rowValues.id,
    setFieldExpanded,
  ])

  return (
    <Box
      as="fieldset"
      disabled={disabled || rowEditor.isSaving}
      inert={disabled || rowEditor.isSaving}
      borderWidth={0}
      padding="none"
      margin="none"
      minWidth={0}
      height="full"
      minHeight={0}
      flexDirection="column"
    >
      <Box
        paddingHorizontal="m"
        paddingVertical="s"
        pr="l"
      >
        <ToggleGroup<RowRepresentation>
          aria-label="Row representation"
          itemWidth="equal"
          value={[representation]}
          width="full"
          onValueChange={(values) => {
            const nextRepresentation = values[0]
            if (nextRepresentation !== undefined) {
              onRepresentationChange(nextRepresentation)
            }
          }}
        >
          <ToggleGroup.Item value="details">Details</ToggleGroup.Item>
          <ToggleGroup.Item value="json">JSON</ToggleGroup.Item>
          <ToggleGroup.Item value="provenance">Provenance</ToggleGroup.Item>
        </ToggleGroup>
        {rowEditor.saveError !== null ? (
          <Text
            color="error"
            role="alert"
          >
            {rowEditor.saveError}
          </Text>
        ) : null}
      </Box>
      <Box
        as="form"
        id="edit-row-form"
        inert={disabled || rowEditor.isSaving}
        data-slot="edit-row-form"
        height="full"
        minHeight={0}
        flexDirection="column"
        mt="m"
        overflow="hidden"
        onSubmit={rowEditor.submit}
      >
        {representation === 'details' ? (
          <Box
            flexGrow={1}
            mb="m"
            minHeight={0}
            overflow="hidden"
          >
            <ScrollArea
              axis={rowEditor.expandedColumnName === null ? 'vertical' : 'none'}
              data-row-editor-scroll-owner={
                rowEditor.expandedColumnName === null ? 'form' : 'editor'
              }
            >
              <Box
                flexDirection="column"
                flexGrow={1}
                gap="xl"
                minHeight={0}
                px="m"
              >
                <RowEditorFields
                  disabled={disabled || rowEditor.isSaving}
                  errors={rowEditor.errors}
                  expandedColumnName={rowEditor.expandedColumnName}
                  fieldStates={rowEditor.fieldStates}
                  schemaColumns={schemaColumns}
                  initialRowValues={rowValues}
                  mode="edit"
                  onFieldContextLeave={rowEditor.validateField}
                  onFieldExpandedChange={rowEditor.setFieldExpanded}
                  onFieldInputChange={rowEditor.setFieldInput}
                />
              </Box>
            </ScrollArea>
          </Box>
        ) : representation === 'json' ? (
          <RowJsonRepresentation
            draft={draft}
            rowValues={rowValues}
            schemaColumns={schemaColumns}
          />
        ) : (
          <RowProvenanceRepresentation rowValues={rowValues} />
        )}
      </Box>
    </Box>
  )
}
