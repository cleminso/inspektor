import { useId, useState } from 'react'
import { ChevronRight, ChevronUp, X } from 'lucide-react'

import { Accordion, Box, Button, FloatingPanel, Text } from '@inspector/ds'

import { InspectorDockCenterPortal } from '@app/shell/dock/centerSlot'
import type { TableMutationExecutor } from '@tables/mutationLedger/applyLedger'
import {
  selectAffectedRows,
  selectTableMutationCounts,
  type TableMutationEntry,
  type TableMutationLedger,
} from '@tables/mutationLedger/ledger'
import { useTableMutationLedger } from '@tables/mutationLedger/provider'
import { useApplyTableMutationLedger } from '@tables/mutationLedger/useApplyTableMutationLedger'

function formatStagedCount(ledger: TableMutationLedger): string {
  const counts = selectTableMutationCounts(ledger)
  if (counts.total === counts.update) {
    return `${counts.total} ${counts.total === 1 ? 'update' : 'updates'} staged`
  }
  if (counts.total === counts.delete) {
    return `${counts.total} ${counts.total === 1 ? 'deletion' : 'deletions'} staged`
  }
  return `${counts.total} ${counts.total === 1 ? 'change' : 'changes'} staged`
}

function shortenIdentity(identity: string): string {
  return identity.length <= 16 ? identity : `${identity.slice(0, 8)}…${identity.slice(-4)}`
}

function ReviewRow({
  entryId,
  fieldCount,
  rowId,
  onRemove,
}: {
  entryId: TableMutationEntry['entryId']
  fieldCount?: number
  rowId: string
  onRemove: (entryId: TableMutationEntry['entryId']) => void
}): React.ReactElement {
  const label = shortenIdentity(rowId)
  return (
    <Box
      as="li"
      alignItems="center"
      gap="s"
      minWidth={0}
    >
      <Text truncate>{label}</Text>
      {fieldCount === undefined ? null : (
        <Text
          color="muted"
          variant="caption"
        >
          {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
        </Text>
      )}
      <Button
        aria-label={`Remove ${label} staged change`}
        iconOnly
        size="s"
        variant="ghost"
        onClick={() => onRemove(entryId)}
      >
        <Button.Glyph artwork={X} />
      </Button>
    </Box>
  )
}

function ReviewSection({
  children,
  count,
  label,
  value,
}: {
  children: React.ReactNode
  count: number
  label: string
  value: string
}): React.ReactElement {
  return (
    <Accordion.Item value={value}>
      {/* oxlint-disable-next-line jsx-a11y/heading-has-content -- Base UI composes the trigger into this heading. */}
      <Accordion.Header render={<h2 />}>
        <Accordion.Trigger
          aria-label={`${label}, ${count}`}
          suffix={
            <Text
              as="span"
              color="muted"
              tabularNums
              variant="caption"
            >
              {count}
            </Text>
          }
        >
          {label}
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>
        <Box
          as="ul"
          flexDirection="column"
          gap="s"
          paddingTop="xxs"
        >
          {children}
        </Box>
      </Accordion.Panel>
    </Accordion.Item>
  )
}

function AffectedRowsReview({
  id,
  ledger,
  onRemove,
}: {
  id: string
  ledger: TableMutationLedger
  onRemove: (entryId: TableMutationEntry['entryId']) => void
}): React.ReactElement {
  const affectedRows = selectAffectedRows(ledger)
  return (
    <Box
      as="section"
      aria-label="Affected rows"
      id={id}
      borderBottomWidth={1}
      borderColor="subtle"
      borderStyle="solid"
      flexDirection="column"
      height="panel-height"
      padding="m"
    >
      <Accordion
        defaultValue={['updates', 'deletions']}
        layout="fill"
        multiple
      >
        {affectedRows.updates.length === 0 ? null : (
          <ReviewSection
            count={affectedRows.updates.length}
            label="Updates"
            value="updates"
          >
            {affectedRows.updates.map((update) => (
              <ReviewRow
                key={update.entryId}
                entryId={update.entryId}
                fieldCount={update.fieldCount}
                rowId={update.rowId}
                onRemove={onRemove}
              />
            ))}
          </ReviewSection>
        )}
        {affectedRows.deletes.length === 0 ? null : (
          <ReviewSection
            count={affectedRows.deletes.length}
            label="Deletions"
            value="deletions"
          >
            {affectedRows.deletes.map((deletion) => (
              <ReviewRow
                key={deletion.entryId}
                entryId={deletion.entryId}
                rowId={deletion.rowId}
                onRemove={onRemove}
              />
            ))}
          </ReviewSection>
        )}
      </Accordion>
    </Box>
  )
}

function DockTrigger({
  contentId,
  expanded,
  label,
  onToggle,
}: {
  contentId: string
  expanded: boolean
  label: string
  onToggle: () => void
}): React.ReactElement {
  return (
    <InspectorDockCenterPortal>
      <Button
        aria-controls={contentId}
        aria-expanded={expanded}
        suffix={<Button.Glyph artwork={expanded === true ? ChevronUp : ChevronRight} />}
        size="s"
        variant="ghost"
        onClick={onToggle}
      >
        {label}
      </Button>
    </InspectorDockCenterPortal>
  )
}

export function TableMutationWidget({
  executor,
  onApplySuccess,
  selectedRowIds,
}: {
  executor: TableMutationExecutor
  onApplySuccess?: () => void
  selectedRowIds: readonly string[]
}): React.ReactElement | null {
  const mutations = useTableMutationLedger()
  const apply = useApplyTableMutationLedger({ executor, onSuccess: onApplySuccess })
  const [collapsed, setCollapsed] = useState(false)
  const [deleteConfirmationRowIds, setDeleteConfirmationRowIds] = useState<
    readonly string[] | null
  >(null)
  const [reviewExpanded, setReviewExpanded] = useState(false)
  const contentId = useId()
  const reviewId = useId()
  const hasPending =
    mutations.ledger.entries.length > 0 || mutations.hasInvalidEditor === true

  if (hasPending === false && selectedRowIds.length === 0) {
    return null
  }

  const expanded = collapsed === false
  const label = hasPending === true
    ? mutations.execution.status === 'applying'
      ? `Applying changes · ${formatStagedCount(mutations.ledger)}`
      : mutations.execution.status === 'failed' || mutations.hasInvalidEditor === true
        ? `Needs attention · ${formatStagedCount(mutations.ledger)}`
        : 'Staged changes'
    : `${selectedRowIds.length} ${selectedRowIds.length === 1 ? 'row' : 'rows'} selected`

  return (
    <>
      <DockTrigger
        contentId={contentId}
        expanded={expanded}
        label={label}
        onToggle={() => setCollapsed(expanded)}
      />
      {expanded === false ? null : (
        <FloatingPanel.Root aria-label={hasPending === true ? 'Staged changes' : 'Row selection actions'}>
          <FloatingPanel.Content id={contentId}>
            {hasPending === true && reviewExpanded === true ? (
              <AffectedRowsReview
                id={reviewId}
                ledger={mutations.ledger}
                onRemove={mutations.removeEntry}
              />
            ) : null}
            <FloatingPanel.Summary>
              <Box
                flex={1}
                minWidth={0}
                flexDirection="column"
              >
                {hasPending === true ? (
                  <Button
                    aria-controls={reviewId}
                    aria-expanded={reviewExpanded}
                    disabled={mutations.ledger.entries.length === 0}
                    size="s"
                    suffix={<Button.Glyph artwork={reviewExpanded === true ? ChevronUp : ChevronRight} />}
                    variant="ghost"
                    onClick={() => setReviewExpanded((current) => current === false)}
                  >
                    Review changes
                  </Button>
                ) : (
                  <Text variant="label">
                    {deleteConfirmationRowIds === null
                      ? label
                      : `Delete ${deleteConfirmationRowIds.length} ${deleteConfirmationRowIds.length === 1 ? 'row' : 'rows'}?`}
                  </Text>
                )}
                {mutations.hasInvalidEditor === true ? (
                  <Text color="error">Correct invalid input before applying.</Text>
                ) : mutations.execution.error === null ? null : (
                  <Text color="error">{mutations.execution.error}</Text>
                )}
              </Box>
              <FloatingPanel.Actions>
                {hasPending === true ? (
                  mutations.execution.status === 'applying' ? (
                    <Text color="muted">Applying changes</Text>
                  ) : (
                    <>
                      <Button
                        size="s"
                        variant="ghost"
                        onClick={mutations.discardAll}
                      >
                        Discard
                      </Button>
                      <Button
                        disabled={mutations.hasInvalidEditor === true}
                        size="s"
                        onClick={() => void apply()}
                      >
                        Apply changes
                      </Button>
                    </>
                  )
                ) : deleteConfirmationRowIds === null ? (
                  <Button
                    size="s"
                    variant="danger"
                    onClick={() => setDeleteConfirmationRowIds([...selectedRowIds])}
                  >
                    Delete rows
                  </Button>
                ) : (
                  <>
                    <Button
                      size="s"
                      variant="ghost"
                      onClick={() => setDeleteConfirmationRowIds(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="s"
                      variant="danger"
                      onClick={() => {
                        mutations.dispatch({ type: 'deleteRows', rowIds: deleteConfirmationRowIds })
                        setDeleteConfirmationRowIds(null)
                      }}
                    >
                      Confirm delete
                    </Button>
                  </>
                )}
              </FloatingPanel.Actions>
            </FloatingPanel.Summary>
          </FloatingPanel.Content>
        </FloatingPanel.Root>
      )}
    </>
  )
}
