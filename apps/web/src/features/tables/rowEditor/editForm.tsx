import { useMemo, useState } from 'react'

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
} from '@inspector/ds'

import { RowEditorFields, useRowEditorFields } from '@tables/rowEditor/editorFields'
import { focusRowEditorField } from '@tables/rowEditor/fieldFocus'
import {
  useRowDraftController,
  type RowDraftController,
} from '@tables/rowEditor/mutation/useRowDraftController'
import { createRowJsonViewValue } from '@tables/rowEditor/values/jsonView'

interface EditRowFormProps {
  draftController?: RowDraftController
  onDirtyChange?: (isDirty: boolean) => void
  onSave?: (values: Record<string, unknown>) => Promise<void> | void
  rowValues: Record<string, unknown> | null
  schemaColumns: ColumnDescriptor[]
  targetRowId: string | null
}

export { focusRowEditorField }

export function EditRowForm({
  draftController,
  onDirtyChange,
  onSave,
  rowValues,
  schemaColumns,
  targetRowId,
}: EditRowFormProps): React.ReactElement {
  if (rowValues === null) {
    return (
      <Box
        height="full"
        alignItems="center"
        justifyContent="center"
        role="status"
        aria-live="polite"
      >
        <Text color="muted">Loading row</Text>
      </Box>
    )
  }

  const loadedProps = {
    onDirtyChange,
    onSave,
    rowValues,
    schemaColumns,
  }

  return draftController === undefined ? (
    <OwnedLoadedEditRowForm
      key={targetRowId ?? 'unknown-row'}
      {...loadedProps}
    />
  ) : (
    <LoadedEditRowForm
      key={targetRowId ?? 'unknown-row'}
      {...loadedProps}
      draftController={draftController}
    />
  )
}

interface LoadedEditRowFormProps extends Omit<
  EditRowFormProps,
  'draftController' | 'rowValues' | 'targetRowId'
> {
  draftController: RowDraftController
  rowValues: Record<string, unknown>
}

type OwnedLoadedEditRowFormProps = Omit<LoadedEditRowFormProps, 'draftController'>

function OwnedLoadedEditRowForm(props: OwnedLoadedEditRowFormProps): React.ReactElement {
  const draftController = useRowDraftController({
    initialRowValues: props.rowValues,
    mode: 'edit',
    schemaColumns: props.schemaColumns,
  })

  return (
    <LoadedEditRowForm
      {...props}
      draftController={draftController}
    />
  )
}

type RowRepresentation = 'details' | 'json'

const defaultFindOptions: FindBarSearchOptions = {
  caseSensitive: false,
  wholeWord: false,
  regularExpression: false,
}

function RowJsonRepresentation({
  rowValues,
  schemaColumns,
}: Pick<LoadedEditRowFormProps, 'rowValues' | 'schemaColumns'>): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOptions, setSearchOptions] = useState(defaultFindOptions)
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<JsonViewSearchResults>({
    activeIndex: null,
    count: 0,
    pending: false,
    query: '',
  })
  const value = useMemo(
    () => createRowJsonViewValue(rowValues, schemaColumns),
    [rowValues, schemaColumns],
  )
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

function LoadedEditRowForm({
  draftController,
  onDirtyChange,
  onSave,
  rowValues,
  schemaColumns,
}: LoadedEditRowFormProps): React.ReactElement {
  const [representation, setRepresentation] = useState<RowRepresentation>('details')
  const rowEditor = useRowEditorFields({
    draftController,
    mode: 'edit',
    onDirtyChange,
    onSubmit: onSave ?? (() => undefined),
    schemaColumns,
  })

  return (
    <Box
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
              setRepresentation(nextRepresentation)
            }
          }}
        >
          <ToggleGroup.Item value="details">Details</ToggleGroup.Item>
          <ToggleGroup.Item value="json">JSON</ToggleGroup.Item>
        </ToggleGroup>
      </Box>
      {representation === 'details' ? (
        <Box
          as="form"
          data-slot="edit-row-form"
          height="full"
          minHeight={0}
          flexDirection="column"
          mt="m"
          overflow="hidden"
          onSubmit={rowEditor.submit}
        >
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

                {rowEditor.saveError !== null ? (
                  <Text
                    color="error"
                    role="alert"
                  >
                    {rowEditor.saveError}
                  </Text>
                ) : null}
              </Box>
            </ScrollArea>
          </Box>
        </Box>
      ) : (
        <RowJsonRepresentation
          rowValues={rowValues}
          schemaColumns={schemaColumns}
        />
      )}
    </Box>
  )
}
