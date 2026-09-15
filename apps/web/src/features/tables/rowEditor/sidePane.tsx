import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'

import { Box, Button, Switch, Text, Tooltip } from '@inspektor/ds'
import { useHotkey } from '@tanstack/react-hotkeys'

import { appHotkeyOptions, runAppHotkey } from '@app/hotkeys/appHotkeys'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'
import { DetailPane } from '@tables/rowEditor/detailPane'
import type { TableRowId } from '@tables/tableTypes'

interface RowEditorSidePanelProps {
  canNavigateNext?: boolean
  canNavigatePrevious?: boolean
  children: React.ReactNode
  editedRowIds: TableRowId[]
  insertMoreEnabled?: boolean
  mode: 'insert' | 'edit'
  mutationDisabled?: boolean
  navigationLabel?: string | null
  onClose?: () => void
  onConfirmDelete?: (rowIds: readonly TableRowId[]) => void
  onInsertMoreEnabledChange?: (enabled: boolean) => void
  onNavigateNext: () => void
  onNavigatePrevious: () => void
}

function RowNavigation({
  canNavigateNext,
  canNavigatePrevious,
  navigationLabel,
  onNavigateNext,
  onNavigatePrevious,
}: {
  canNavigateNext: boolean
  canNavigatePrevious: boolean
  navigationLabel: string | null
  onNavigateNext: () => void
  onNavigatePrevious: () => void
}): React.ReactElement {
  useHotkey(
    appHotkeys.previousSelectedRow,
    (event) => {
      if (canNavigatePrevious === true) {
        runAppHotkey(event, onNavigatePrevious, 'allow')
      }
    },
    appHotkeyOptions,
  )
  useHotkey(
    appHotkeys.nextSelectedRow,
    (event) => {
      if (canNavigateNext === true) {
        runAppHotkey(event, onNavigateNext, 'allow')
      }
    },
    appHotkeyOptions,
  )

  return (
    <Box
      ml="auto"
      flexShrink={0}
      alignItems="center"
      gap="xs"
    >
      {navigationLabel === null ? null : (
        <Text
          as="span"
          color="muted"
          tabularNums
        >
          {navigationLabel}
        </Text>
      )}
      <Box alignItems="center">
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="s"
                disabled={canNavigateNext === false}
                focusableWhenDisabled
                onClick={onNavigateNext}
                aria-label="Next row"
                iconOnly
              >
                <Button.Glyph artwork={ArrowDown} />
              </Button>
            }
          />
          <Tooltip.Content>Next row {appHotkeys.nextSelectedRow}</Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="s"
                disabled={canNavigatePrevious === false}
                focusableWhenDisabled
                onClick={onNavigatePrevious}
                aria-label="Previous row"
                iconOnly
              >
                <Button.Glyph artwork={ArrowUp} />
              </Button>
            }
          />
          <Tooltip.Content>Previous row {appHotkeys.previousSelectedRow}</Tooltip.Content>
        </Tooltip.Root>
      </Box>
    </Box>
  )
}

export function RowEditorSidePanel({
  canNavigateNext = false,
  canNavigatePrevious = false,
  children,
  editedRowIds,
  insertMoreEnabled = false,
  mode,
  mutationDisabled = false,
  navigationLabel = null,
  onClose,
  onConfirmDelete,
  onInsertMoreEnabledChange,
  onNavigateNext,
  onNavigatePrevious,
}: RowEditorSidePanelProps): React.ReactElement {
  const [deleteConfirmationRowIds, setDeleteConfirmationRowIds] = useState<
    readonly TableRowId[] | null
  >(null)
  useEffect(() => {
    setDeleteConfirmationRowIds(null)
  }, [mode])
  const insertMoreFieldId = 'insert-more'
  const deleteRowIds = deleteConfirmationRowIds ?? editedRowIds
  const deleteLabel =
    deleteRowIds.length === 1 ? 'Delete row' : `Delete ${deleteRowIds.length} checked rows`
  const footer =
    mode === 'edit' && (onConfirmDelete !== undefined || onClose !== undefined) ? (
      <Box
        as="footer"
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
        {deleteConfirmationRowIds === null || onConfirmDelete === undefined ? (
          <>
            {onConfirmDelete === undefined ? null : (
              <Box flex={1}>
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
              </Box>
            )}
            {onClose === undefined ? null : (
              <Box flex={1}>
                <Button
                  type="button"
                  layout="fill"
                  size="s"
                  variant="secondary"
                  onClick={onClose}
                >
                  Close
                </Button>
              </Box>
            )}
          </>
        ) : (
          <>
            <Box flex={1}>
              <Button
                type="button"
                disabled={mutationDisabled === true}
                layout="fill"
                size="s"
                variant="danger"
                onClick={() => {
                  const confirmedRowIds = deleteConfirmationRowIds
                  setDeleteConfirmationRowIds(null)
                  onConfirmDelete(confirmedRowIds)
                }}
              >
                Confirm delete
              </Button>
            </Box>
            <Box flex={1}>
              <Button
                type="button"
                layout="fill"
                size="s"
                variant="secondary"
                onClick={() => setDeleteConfirmationRowIds(null)}
              >
                Cancel
              </Button>
            </Box>
          </>
        )}
      </Box>
    ) : undefined

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
          {mode === 'insert' ? (
            <Box
              minWidth={0}
              flex={1}
            >
              <Text
                as="h2"
                variant="label"
                truncate
              >
                Insert row
              </Text>
            </Box>
          ) : null}
          {mode === 'insert' && onInsertMoreEnabledChange !== undefined ? (
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
                disabled={mutationDisabled === true}
                size="s"
                onCheckedChange={(checked) => {
                  onInsertMoreEnabledChange(checked === true)
                }}
              />
              <Text
                as="span"
                id={`${insertMoreFieldId}-label`}
                color="muted"
              >
                Insert more
              </Text>
            </Box>
          ) : null}
          {mode === 'edit' && editedRowIds.length > 0 ? (
            <RowNavigation
              canNavigateNext={canNavigateNext}
              canNavigatePrevious={canNavigatePrevious}
              navigationLabel={navigationLabel}
              onNavigateNext={onNavigateNext}
              onNavigatePrevious={onNavigatePrevious}
            />
          ) : null}
        </Box>
      }
    >
      {children}
    </DetailPane>
  )
}
