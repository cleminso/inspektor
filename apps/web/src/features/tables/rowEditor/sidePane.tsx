import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Box, Button, Switch, Text } from "@inspector/ds";

import { DetailPane } from "@tables/rowEditor/detailPane";
import type { TableRowId } from "@tables/tableTypes";

interface RowEditorSidePanelProps {
  activeColumnNumber: number;
  activePageRowNumber: number | null;
  activeRowIndex: number;
  children: React.ReactNode;
  editedRowIds: TableRowId[];
  insertMoreEnabled?: boolean;
  mode: "insert" | "edit";
  mutationDisabled?: boolean;
  onClose?: () => void;
  onConfirmDelete?: (rowIds: readonly TableRowId[]) => void;
  onInsertMoreEnabledChange?: (enabled: boolean) => void;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
}

export function RowEditorSidePanel({
  activeColumnNumber,
  activePageRowNumber,
  activeRowIndex,
  children,
  editedRowIds,
  insertMoreEnabled = false,
  mode,
  mutationDisabled = false,
  onClose,
  onConfirmDelete,
  onInsertMoreEnabledChange,
  onNavigateNext,
  onNavigatePrevious,
}: RowEditorSidePanelProps): React.ReactElement {
  const [deleteConfirmationRowIds, setDeleteConfirmationRowIds] = useState<
    readonly TableRowId[] | null
  >(null);
  const hasMultipleRows = editedRowIds.length > 1;
  const insertMoreFieldId = "insert-more";
  const title =
    mode === "insert"
      ? "Insert row"
      : activePageRowNumber === null
        ? "Edit row"
        : `Edit row ${activePageRowNumber}:${activeColumnNumber}`;
  const deleteRowIds = deleteConfirmationRowIds ?? editedRowIds;
  const deleteLabel =
    deleteRowIds.length === 1 ? "Delete row" : `Delete ${deleteRowIds.length} checked rows`;
  const hasTwoFooterActions =
    deleteConfirmationRowIds !== null ||
    (onConfirmDelete !== undefined && onClose !== undefined);
  const footer =
    mode === "edit" && (onConfirmDelete !== undefined || onClose !== undefined) ? (
      <Box
        as="footer"
        data-slot="row-editor-footer"
        display={hasTwoFooterActions === true ? "grid" : "flex"}
        flexShrink={0}
        alignItems="center"
        gap="xs"
        gridTemplateColumns={hasTwoFooterActions === true ? "three-one" : undefined}
        borderTopWidth={1}
        borderColor="default"
        borderStyle="solid"
        backgroundColor="surface-background"
        paddingHorizontal="m"
        paddingVertical="s"
        paddingRight="l"
      >
        {deleteConfirmationRowIds === null || onConfirmDelete === undefined ? (
          <>
            {onConfirmDelete === undefined ? null : (
              <Button
                type="button"
                disabled={mutationDisabled === true || editedRowIds.length === 0}
                layout="fill"
                size="s"
                variant="danger"
                onClick={() => setDeleteConfirmationRowIds([...editedRowIds])}
              >
                {deleteLabel}
              </Button>
            )}
            {onClose === undefined ? null : (
              <Button type="button" layout="fill" size="s" variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              type="button"
              layout="fill"
              size="s"
              variant="danger"
              onClick={() => {
                const confirmedRowIds = deleteConfirmationRowIds;
                setDeleteConfirmationRowIds(null);
                onConfirmDelete(confirmedRowIds);
              }}
            >
              Confirm delete
            </Button>
            <Button
              type="button"
              layout="fill"
              size="s"
              variant="ghost"
              onClick={() => setDeleteConfirmationRowIds(null)}
            >
              Cancel
            </Button>
          </>
        )}
      </Box>
    ) : undefined;

  return (
    <DetailPane
      footer={footer}
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
                size="s"
                onCheckedChange={(checked) => {
                  onInsertMoreEnabledChange(checked === true);
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
      {children}
    </DetailPane>
  );
}
