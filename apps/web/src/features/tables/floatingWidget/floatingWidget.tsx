import { useId, useState, type UIEvent } from 'react'
import { ChevronRight, ChevronUp } from 'lucide-react'

import { Accordion, Box, Button, FloatingPanel, Text } from '@inspector/ds'

import { InspectorDockCenterPortal } from '@app/shell/dock/centerSlot'
import type { TableMutationExecutor } from '@tables/mutationLedger/applyLedger'
import {
  type TableMutationReview,
  type TableMutationReviewOperation,
} from '@tables/mutationLedger/ledger'
import { useTableMutationLedger } from '@tables/mutationLedger/provider'
import { useApplyTableMutationLedger } from '@tables/mutationLedger/useApplyTableMutationLedger'
import type { TableFieldsByRowId } from '@tables/tableTypes'

function formatOperationSummary(operation: TableMutationReviewOperation): string {
  if (operation.kind === 'delete') {
    return operation.affectedRowCount === 1
      ? (operation.rowIds[0] ?? '')
      : `${operation.affectedRowCount} selected rows`
  }
  return operation.rowId
}

function OperationRow({
  operation,
  onUndo,
}: {
  operation: TableMutationReviewOperation
  onUndo: (operationId: TableMutationReviewOperation['operationId']) => void
}): React.ReactElement {
  const summary = formatOperationSummary(operation)
  return (
    <Box
      as="li"
      alignItems="center"
      data-operation-row
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

const directRenderLimit = 100
const windowSize = 12

function OperationList({
  label,
  operations,
  onUndo,
}: {
  label: string
  operations: readonly TableMutationReviewOperation[]
  onUndo: (operationId: TableMutationReviewOperation['operationId']) => void
}): React.ReactElement {
  const virtualized = operations.length > directRenderLimit
  const [windowStart, setWindowStart] = useState(0)
  const boundedStart = Math.min(windowStart, Math.max(0, operations.length - windowSize))
  const visibleOperations =
    virtualized === true ? operations.slice(boundedStart, boundedStart + windowSize) : operations
  const scrollable = operations.length > 10
  const handleScroll = (event: UIEvent<HTMLElement>) => {
    if (virtualized === false) return
    const viewport = event.currentTarget
    if (viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 1) {
      setWindowStart((current) => Math.min(current + 10, operations.length - windowSize))
      viewport.scrollTop = 1
    } else if (viewport.scrollTop === 0) {
      setWindowStart((current) => Math.max(0, current - 10))
    }
  }
  return (
    <Box
      as="section"
      aria-label={label}
      data-scrollable={scrollable}
      data-virtualized={virtualized}
      maxHeight={scrollable === true ? 'viewport-height-l' : undefined}
      overflowY={scrollable === true ? 'auto' : 'visible'}
      width="full"
      onScroll={handleScroll}
    >
      <Box
        as="ul"
        flexDirection="column"
        width="full"
      >
        {visibleOperations.map((operation) => (
          <OperationRow
            key={operation.operationId}
            operation={operation}
            onUndo={onUndo}
          />
        ))}
      </Box>
    </Box>
  )
}

function ReviewSection({
  count,
  label,
  operations,
  onUndo,
  value,
}: {
  count: number
  label: string
  operations: readonly TableMutationReviewOperation[]
  onUndo: (operationId: TableMutationReviewOperation['operationId']) => void
  value: string
}): React.ReactElement {
  return (
    <Accordion.Item value={value}>
      <Accordion.Header level={2}>
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
  review,
  onUndo,
}: {
  id: string
  review: TableMutationReview
  onUndo: (operationId: TableMutationReviewOperation['operationId']) => void
}): React.ReactElement {
  const updates = review.operations.filter((operation) => operation.kind === 'update')
  const deletions = review.operations.filter((operation) => operation.kind === 'delete')
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
            count={updates.length}
            label="Updated rows"
            operations={updates}
            value="updates"
            onUndo={onUndo}
          />
        )}
        {deletions.length === 0 ? null : (
          <ReviewSection
            count={deletions.length}
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

function DockTrigger({
  contentId,
  count,
  expanded,
  label,
  onToggle,
}: {
  contentId: string
  count: number
  expanded: boolean
  label: string
  onToggle: () => void
}): React.ReactElement {
  return (
    <InspectorDockCenterPortal>
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
            {count}
          </Text>
        }
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
    onAppliedUpdates,
    onSuccess: onApplySuccess,
  })
  const [collapsed, setCollapsed] = useState(false)
  const [reviewExpanded, setReviewExpanded] = useState(false)
  const contentId = useId()
  const reviewId = useId()
  const hasPending = mutations.ledger.entries.length > 0 || mutations.hasInvalidEditor === true

  if (hasPending === false) {
    return null
  }

  const expanded = collapsed === false
  const label =
    mutations.execution.status === 'applying'
      ? 'Applying changes'
      : mutations.execution.status === 'failed' || mutations.hasInvalidEditor === true
        ? 'Needs attention'
        : 'Staged changes'

  return (
    <>
      <DockTrigger
        contentId={contentId}
        count={mutations.stagedCount}
        expanded={expanded}
        label={label}
        onToggle={() => setCollapsed(expanded)}
      />
      {expanded === false ? null : (
        <FloatingPanel.Root aria-label="Staged changes">
          <FloatingPanel.Content
            id={contentId}
            size={reviewExpanded === true ? 'expanded' : 'compact'}
          >
            <FloatingPanel.Details open={reviewExpanded}>
              <OperationReview
                id={reviewId}
                review={mutations.review}
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
                {mutations.hasInvalidEditor === true ? (
                  <Text color="error">Correct invalid input before applying.</Text>
                ) : mutations.execution.error === null ? null : (
                  <Text color="error">{mutations.execution.error}</Text>
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
                      disabled={mutations.hasInvalidEditor === true}
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
