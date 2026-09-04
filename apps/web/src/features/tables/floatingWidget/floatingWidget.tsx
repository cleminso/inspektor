import { useId, useState } from 'react'
import { ChevronRight, ChevronUp } from 'lucide-react'

import { Accordion, Box, Button, FloatingPanel, Text } from '@inspektor/ds'

import { InspectorFooterCenterPortal } from '@app/shell/footer/centerSlot'
import type { TableMutationExecutor } from '@tables/mutationLedger/applyLedger'
import type { TableMutationReviewOperation } from '@tables/mutationLedger/ledger'
import { useTableMutationLedger } from '@tables/mutationLedger/provider'
import { useApplyTableMutationLedger } from '@tables/mutationLedger/useApplyTableMutationLedger'
import type { TableFieldsByRowId } from '@tables/tableTypes'

const operationBatchSize = 50

function OperationRow({
  position,
  operation,
  onUndo,
  total,
}: {
  position: number
  operation: TableMutationReviewOperation
  onUndo: (operationId: TableMutationReviewOperation['operationId']) => void
  total: number
}): React.ReactElement {
  const summary =
    operation.kind === 'update'
      ? operation.rowId
      : operation.rowIds.length === 1
        ? (operation.rowIds[0] ?? '')
        : `${operation.rowIds.length} selected rows`
  return (
    <Box
      as="li"
      alignItems="center"
      aria-posinset={position}
      aria-setsize={total}
      display="flex"
      gap="s"
      height="collection-row-height-xl"
      minWidth={0}
      paddingLeft="s"
      width="full"
    >
      <Box
        alignItems="center"
        flex={1}
        gap="s"
        minWidth={0}
      >
        <Text truncate>{summary}</Text>
        {operation.kind === 'update' ? (
          <Text
            color="muted"
            truncate
            variant="caption"
          >
            {operation.fieldNames.join(', ')}
          </Text>
        ) : null}
      </Box>
      <Box
        flexShrink={0}
        ml="auto"
      >
        <Button
          aria-label={`Undo: ${summary}`}
          size="s"
          variant="ghost"
          onClick={() => onUndo(operation.operationId)}
        >
          Undo
        </Button>
      </Box>
    </Box>
  )
}

function OperationList({
  label,
  operations,
  onUndo,
}: {
  label: string
  operations: readonly TableMutationReviewOperation[]
  onUndo: (operationId: TableMutationReviewOperation['operationId']) => void
}): React.ReactElement {
  const scrollable = operations.length > 10
  const [visibleCount, setVisibleCount] = useState(operationBatchSize)
  return (
    <Box
      as="section"
      aria-label={label}
      maxHeight={scrollable === true ? 'viewport-height-l' : undefined}
      overflowY={scrollable === true ? 'auto' : 'visible'}
      width="full"
    >
      <Box
        as="ul"
        flexDirection="column"
        width="full"
      >
        {operations.slice(0, visibleCount).map((operation, index) => (
          <OperationRow
            key={operation.operationId}
            operation={operation}
            position={index + 1}
            total={operations.length}
            onUndo={onUndo}
          />
        ))}
      </Box>
      {visibleCount < operations.length ? (
        <Button
          aria-label={`Show more ${label.toLowerCase()}`}
          size="s"
          variant="ghost"
          onClick={() => setVisibleCount((current) => current + operationBatchSize)}
        >
          Show more
        </Button>
      ) : null}
    </Box>
  )
}

function ReviewSection({
  label,
  operations,
  onUndo,
  value,
}: {
  label: string
  operations: readonly TableMutationReviewOperation[]
  onUndo: (operationId: TableMutationReviewOperation['operationId']) => void
  value: string
}): React.ReactElement {
  return (
    <Accordion.Item value={value}>
      <Accordion.Header level={2}>
        <Accordion.Trigger
          aria-label={`${label}, ${operations.length}`}
          suffix={
            <Text
              as="span"
              color="muted"
              tabularNums
              variant="caption"
            >
              {operations.length}
            </Text>
          }
        >
          {label}
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>
        <OperationList
          label={`${label.slice(0, -1)} operations`}
          operations={operations}
          onUndo={onUndo}
        />
      </Accordion.Panel>
    </Accordion.Item>
  )
}

function OperationReview({
  id,
  operations,
  onUndo,
}: {
  id: string
  operations: readonly TableMutationReviewOperation[]
  onUndo: (operationId: TableMutationReviewOperation['operationId']) => void
}): React.ReactElement {
  const updates = operations.filter((operation) => operation.kind === 'update')
  const deletions = operations.filter((operation) => operation.kind === 'delete')
  return (
    <Box
      as="section"
      aria-label="Affected rows"
      id={id}
      borderBottomWidth={1}
      borderColor="subtle"
      borderStyle="solid"
      flexDirection="column"
      padding="s"
    >
      <Accordion
        defaultValue={['updates', 'deletions']}
        multiple
      >
        {updates.length === 0 ? null : (
          <ReviewSection
            label="Updated rows"
            operations={updates}
            value="updates"
            onUndo={onUndo}
          />
        )}
        {deletions.length === 0 ? null : (
          <ReviewSection
            label="Deleted rows"
            operations={deletions}
            value="deletions"
            onUndo={onUndo}
          />
        )}
      </Accordion>
    </Box>
  )
}

export function TableMutationWidget({
  executor,
  onAppliedUpdates,
  onApplySuccess,
}: {
  executor: TableMutationExecutor
  onAppliedUpdates?: (appliedUpdateFields: TableFieldsByRowId) => void
  onApplySuccess?: () => void
}): React.ReactElement | null {
  const mutations = useTableMutationLedger()
  const apply = useApplyTableMutationLedger({
    executor,
    mutations,
    onAppliedUpdates,
    onSuccess: onApplySuccess,
  })
  const [expanded, setExpanded] = useState(true)
  const [reviewExpanded, setReviewExpanded] = useState(false)
  const contentId = useId()
  const reviewId = useId()
  const hasPending =
    mutations.ledger.entries.length > 0 || mutations.ledger.hasInvalidDraft === true

  if (hasPending === false) {
    return null
  }

  const label =
    mutations.execution.status === 'applying'
      ? 'Applying changes'
      : mutations.execution.status === 'failed' || mutations.ledger.hasInvalidDraft === true
        ? 'Needs attention'
        : 'Staged changes'

  return (
    <>
      <InspectorFooterCenterPortal>
        <Button
          aria-controls={contentId}
          aria-expanded={expanded}
          aria-pressed={expanded}
          prefix={
            <Text
              as="span"
              tabularNums
              variant="caption"
            >
              {mutations.stagedCount}
            </Text>
          }
          suffix={<Button.Glyph artwork={expanded === true ? ChevronUp : ChevronRight} />}
          size="s"
          variant="ghost"
          onClick={() => setExpanded((current) => current === false)}
        >
          {label}
        </Button>
      </InspectorFooterCenterPortal>
      {expanded === false ? null : (
        <FloatingPanel.Root aria-label="Staged changes">
          <FloatingPanel.Content
            id={contentId}
            size={reviewExpanded === true ? 'expanded' : 'compact'}
          >
            <FloatingPanel.Details open={reviewExpanded}>
              <OperationReview
                id={reviewId}
                operations={mutations.reviewOperations}
                onUndo={mutations.undoReviewOperation}
              />
            </FloatingPanel.Details>
            <FloatingPanel.Summary>
              <Box
                alignItems="start"
                flex={1}
                minWidth={0}
                flexDirection="column"
              >
                <Button
                  aria-controls={reviewId}
                  aria-expanded={reviewExpanded}
                  disabled={mutations.ledger.entries.length === 0}
                  size="s"
                  suffix={
                    <Button.Glyph artwork={reviewExpanded === true ? ChevronUp : ChevronRight} />
                  }
                  variant="ghost"
                  onClick={() => setReviewExpanded(reviewExpanded === false)}
                >
                  Review changes
                </Button>
                {mutations.ledger.hasInvalidDraft === true ? (
                  <Text color="error">Correct invalid input before applying.</Text>
                ) : mutations.execution.error === null ? null : (
                  <Text
                    color="error"
                    role="alert"
                  >
                    {mutations.execution.error}
                  </Text>
                )}
              </Box>
              <FloatingPanel.Actions>
                {mutations.execution.status === 'applying' ? (
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
                      disabled={mutations.ledger.hasInvalidDraft === true}
                      size="s"
                      onClick={() => void apply()}
                    >
                      Apply changes
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
