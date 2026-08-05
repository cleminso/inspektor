import { useMemo, useState } from "react";

import type { ColumnDescriptor } from "jazz-tools";

import {
  Box,
  Button,
  FindBar,
  JsonView,
  ScrollArea,
  Text,
  ToggleGroup,
  type FindBarSearchOptions,
  type FindBarState,
  type JsonViewSearchResults,
} from "@inspector/ds";

import {
  RowEditorFields,
  useRowEditorFields,
} from "@tables/rowEditor/editorFields";
import { focusRowEditorField } from "@tables/rowEditor/fieldFocus";
import { ROW_EDITOR_FORM_ID } from "@tables/rowEditor/editorForm";
import {
  createRowJsonViewValue,
} from "@tables/rowEditor/values/jsonView";

interface EditRowFormProps {
  onCancel?: () => void;
  onDelete?: () => Promise<void> | void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSave: (values: Record<string, unknown>) => Promise<void> | void;
  rowValues: Record<string, unknown> | null;
  schemaColumns: ColumnDescriptor[];
  targetRowId: string | null;
}

export { focusRowEditorField };

export function EditRowForm({
  onCancel,
  onDelete,
  onDirtyChange,
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
      onDirtyChange={onDirtyChange}
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

const defaultFindOptions: FindBarSearchOptions = {
  caseSensitive: false,
  wholeWord: false,
  regularExpression: false,
};

function RowJsonRepresentation({
  rowValues,
  schemaColumns,
}: Pick<LoadedEditRowFormProps, "rowValues" | "schemaColumns">): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOptions, setSearchOptions] = useState(defaultFindOptions);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<JsonViewSearchResults>({
    activeIndex: null,
    count: 0,
  });
  const value = useMemo(
    () => createRowJsonViewValue(rowValues, schemaColumns),
    [rowValues, schemaColumns],
  );
  const findState: FindBarState =
    searchQuery.length === 0
      ? { status: "idle" }
      : searchResults.activeIndex === null
        ? { status: "empty" }
        : {
            status: "matched",
            activeIndex: searchResults.activeIndex,
            count: searchResults.count,
          };
  return (
    <Box height="full" minHeight={0} flexDirection="column" gap="m" px="m" py="m">
      <Box flexShrink={0} alignItems="center" gap="m">
        <FindBar
          label="Find in row JSON"
          value={searchQuery}
          onValueChange={(nextValue) => {
            setSearchQuery(nextValue);
            setActiveMatchIndex(0);
            setSearchResults({ activeIndex: null, count: 0 });
          }}
          state={findState}
          searchOptions={searchOptions}
          onSearchOptionsChange={(nextOptions) => {
            setSearchOptions(nextOptions);
            setActiveMatchIndex(0);
            setSearchResults({ activeIndex: null, count: 0 });
          }}
          onPreviousMatch={() => {
            setActiveMatchIndex((searchResults.activeIndex ?? 0) - 1);
          }}
          onNextMatch={() => {
            setActiveMatchIndex((searchResults.activeIndex ?? 0) + 1);
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
  );
}

function LoadedEditRowForm({
  onCancel,
  onDelete,
  onDirtyChange,
  onSave,
  rowValues,
  schemaColumns,
}: LoadedEditRowFormProps): React.ReactElement {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [representation, setRepresentation] = useState<RowRepresentation>("details");
  const rowEditor = useRowEditorFields({
    initialRowValues: rowValues,
    mode: "edit",
    onDirtyChange,
    onSubmit: onSave,
    schemaColumns,
  });

  return (
    <Box height="full" minHeight={0} flexDirection="column">
      <Box px="m" pt="m">
        <ToggleGroup<RowRepresentation>
          aria-label="Row representation"
          itemWidth="equal"
          value={[representation]}
          width="full"
          onValueChange={(values) => {
            const nextRepresentation = values[0];
            if (nextRepresentation !== undefined) {
              setRepresentation(nextRepresentation);
            }
          }}
        >
          <ToggleGroup.Item value="details">Details</ToggleGroup.Item>
          <ToggleGroup.Item value="json">JSON</ToggleGroup.Item>
        </ToggleGroup>
      </Box>
      {representation === "details" ? (
        <Box
          as="form"
          id={ROW_EDITOR_FORM_ID}
          height="full"
          minHeight={0}
          flexDirection="column"
          mt="m"
          overflow="hidden"
          onSubmit={rowEditor.submit}
        >
          <Box flexGrow={1} mb="m" minHeight={0} overflow="hidden">
            <ScrollArea
              axis={rowEditor.expandedColumnName === null ? "vertical" : "none"}
              data-row-editor-scroll-owner={
                rowEditor.expandedColumnName === null ? "form" : "editor"
              }
            >
              <Box flexDirection="column" flexGrow={1} gap="xl" minHeight={0} px="m">
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

                {deleteError !== null || rowEditor.saveError !== null ? (
                  <Text color="error" role="alert">
                    {deleteError ?? rowEditor.saveError}
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
            {onDelete !== undefined ? (
              <Button
                type="button"
                variant="danger"
                size="s"
                disabled={isDeleting === true || rowEditor.isSaving === true}
                onClick={async () => {
                  if (isDeleteConfirming === false) {
                    setDeleteError(null);
                    setIsDeleteConfirming(true);
                    return;
                  }

                  try {
                    setIsDeleting(true);
                    setDeleteError(null);
                    await onDelete();
                  } catch (nextError) {
                    setDeleteError(
                      nextError instanceof Error ? nextError.message : String(nextError),
                    );
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
            <Box ml={onDelete === undefined ? "auto" : "none"} alignItems="center" gap="m">
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
                  disabled={rowEditor.isSaving === true || isDeleting === true}
                >
                  Cancel
                </Button>
              ) : null}
              <Button
                type="submit"
                variant="primary"
                size="s"
                loading={rowEditor.isSaving === true}
                disabled={isDeleting === true}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        <RowJsonRepresentation rowValues={rowValues} schemaColumns={schemaColumns} />
      )}
    </Box>
  );
}
