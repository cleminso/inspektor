import { ArrowDown, ArrowUp } from "lucide-react";

import { Box, Button, Switch, Text } from "@inspector/ds";

import { DetailPane } from "@tables/rowEditor/detailPane";
import { ROW_EDITOR_FORM_ID } from "@tables/rowEditor/editorForm";
import type { TableRowId } from "@tables/tableTypes";

interface RowEditorSidePanelProps {
  activeColumnNumber: number;
  activePageRowNumber: number | null;
  activeRowIndex: number;
  children: React.ReactNode;
  draftTransitionPending: boolean;
  draftTransitionSaving: boolean;
  editedRowIds: TableRowId[];
  insertMoreEnabled?: boolean;
  mode: "insert" | "edit";
  onDiscardAndContinue: () => void;
  onInsertMoreEnabledChange?: (enabled: boolean) => void;
  onKeepEditing: () => void;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
}

export function RowEditorSidePanel({
  activeColumnNumber,
  activePageRowNumber,
  activeRowIndex,
  children,
  draftTransitionPending,
  draftTransitionSaving,
  editedRowIds,
  insertMoreEnabled = false,
  mode,
  onDiscardAndContinue,
  onInsertMoreEnabledChange,
  onKeepEditing,
  onNavigateNext,
  onNavigatePrevious,
}: RowEditorSidePanelProps): React.ReactElement {
  const hasMultipleRows = editedRowIds.length > 1;
  const title =
    mode === "insert"
      ? "Insert row"
      : activePageRowNumber === null
        ? "Edit row"
        : `Edit row ${activePageRowNumber}:${activeColumnNumber}`;
  const insertMoreFieldId = "insert-more";

  return (
    <DetailPane
      title={
        <Box
          data-slot="row-editor-header-content"
          minWidth={0}
          minHeight="control-height-s"
          flex={1}
          alignItems="center"
          gap="l"
        >
          <Box minWidth={0} flex={1}>
            <Text as="h2" variant="label" truncate>
              {title}
            </Text>
          </Box>
          {mode === "insert" && onInsertMoreEnabledChange !== undefined ? (
            <Box
              as="label"
              htmlFor={insertMoreFieldId}
              display="flex"
              ml="auto"
              flexShrink={0}
              alignItems="center"
              gap="xs"
            >
              <Switch
                id={insertMoreFieldId}
                aria-labelledby={`${insertMoreFieldId}-label`}
                checked={insertMoreEnabled}
                disabled={draftTransitionSaving}
                size="s"
                onCheckedChange={(nextChecked) => {
                  onInsertMoreEnabledChange(nextChecked === true)
                }}
              />
              <Text as="span" id={`${insertMoreFieldId}-label`} color="muted">
                Insert more
              </Text>
            </Box>
          ) : null}
          {hasMultipleRows === true ? (
            <Box
              ml="auto"
              flexShrink={0}
              alignItems="center"
              gap="xs"
            >
              <Text as="span" color="muted" tabularNums>
                {activeRowIndex + 1} / {editedRowIds.length}
              </Text>
              <Box alignItems="center">
                <Button
                  type="button"
                  variant="ghost"
                  size="s"
                  disabled={activeRowIndex === 0}
                  onClick={onNavigatePrevious}
                  aria-label="Previous selected row"
                  iconOnly
                >
                  <Button.Glyph artwork={ArrowUp} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="s"
                  disabled={activeRowIndex >= editedRowIds.length - 1}
                  onClick={onNavigateNext}
                  aria-label="Next selected row"
                  iconOnly
                >
                  <Button.Glyph artwork={ArrowDown} />
                </Button>
              </Box>
            </Box>
          ) : null}
        </Box>
      }
    >
      {draftTransitionPending === true ? (
        <Box
          aria-label="Unsaved row changes"
          role="alertdialog"
          flexDirection="column"
          flexShrink={0}
          gap="m"
          padding="m"
          borderBottomWidth={1}
          borderColor="subtle"
          borderStyle="solid"
        >
          <Box flexDirection="column" gap="xs">
            <Text variant="label">Save changes before continuing?</Text>
            <Text color="muted" variant="caption">
              The current row has staged changes.
            </Text>
          </Box>
          <Box alignItems="center" gap="s" justifyContent="end">
            <Button
              type="button"
              variant="ghost"
              size="s"
              autoFocus
              disabled={draftTransitionSaving === true}
              onClick={onKeepEditing}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="danger"
              size="s"
              disabled={draftTransitionSaving === true}
              onClick={onDiscardAndContinue}
            >
              Discard and continue
            </Button>
            <Button
              type="submit"
              form={ROW_EDITOR_FORM_ID}
              variant="primary"
              size="s"
              loading={draftTransitionSaving === true}
              disabled={draftTransitionSaving === true}
            >
              Save and continue
            </Button>
          </Box>
        </Box>
      ) : null}
      {children}
    </DetailPane>
  );
}
