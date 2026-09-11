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
} from '@inspektor/ds'

import { RowEditorFields, useRowEditorFields } from '@tables/rowEditor/editorFields'
import type { RowDraftController } from '@tables/rowEditor/mutation/useRowDraftController'
import { buildRowMutationValueProjection } from '@tables/rowEditor/mutation/draft'
import { RowProvenanceFields } from '@tables/rowEditor/provenanceFields'
import { createRowJsonViewValue } from '@tables/rowEditor/values/jsonView'
import { TABLE_PROVENANCE_COLUMNS } from '@tables/tableProvenance'

interface EditRowFormProps {
  draftController: RowDraftController
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
  draftController,
  rowValues,
  schemaColumns,
}: Pick<EditRowFormProps, 'draftController' | 'rowValues' | 'schemaColumns'>): React.ReactElement {
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
    const projection = buildRowMutationValueProjection(draftController.state.draft, schemaColumns)
    return createRowJsonViewValue(
      { ...rowValues, ...projection.displayValues },
      [...schemaColumns, ...TABLE_PROVENANCE_COLUMNS],
    )
  }, [draftController.state.draft, rowValues, schemaColumns])
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
  draftController,
  onRepresentationChange,
  representation,
  rowValues,
  schemaColumns,
}: EditRowFormProps): React.ReactElement {
  const rowEditor = useRowEditorFields({
    draftController,
    mode: 'edit',
    onSubmit: () => undefined,
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
              onRepresentationChange(nextRepresentation)
            }
          }}
        >
          <ToggleGroup.Item value="details">Details</ToggleGroup.Item>
          <ToggleGroup.Item value="json">JSON</ToggleGroup.Item>
          <ToggleGroup.Item value="provenance">Provenance</ToggleGroup.Item>
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
                  schemaColumns={schemaColumns}
                  initialRowValues={rowValues}
                  mode="edit"
                  onFieldExpandedChange={rowEditor.setFieldExpanded}
                  onFieldInputChange={rowEditor.setFieldInput}
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
      ) : representation === 'json' ? (
        <RowJsonRepresentation
          draftController={draftController}
          rowValues={rowValues}
          schemaColumns={schemaColumns}
        />
      ) : (
        <RowProvenanceRepresentation rowValues={rowValues} />
      )}
    </Box>
  )
}
