import { Accordion, Box, Button, FloatingPanel, Text } from '@inspektor/ds'
import { type ReactElement, useId, useState } from 'react'

interface PendingChange {
  detail?: string
  id: string
  kind: 'deletion' | 'update'
  rowId: string
}

const initialChanges: readonly PendingChange[] = [
  { id: 'email', kind: 'update', rowId: 'account_0001', detail: 'email' },
  { id: 'role', kind: 'update', rowId: 'account_0002', detail: 'role' },
  { id: 'delete', kind: 'deletion', rowId: 'account_0003' },
]

function ChangeList({
  changes,
  onUndo,
}: {
  changes: readonly PendingChange[]
  onUndo: (id: string) => void
}): ReactElement {
  return (
    <Box
      as="ul"
      flexDirection="column"
      width="full"
    >
      {changes.map((change) => (
        <Box
          as="li"
          key={change.id}
          alignItems="center"
          display="flex"
          gap="s"
          height="collection-row-height-xl"
          minWidth={0}
          paddingLeft="s"
          width="full"
        >
          <Box
            flex={1}
            minWidth={0}
            gap="s"
          >
            <Text truncate>{change.rowId}</Text>
            {change.detail === undefined ? null : (
              <Text
                color="muted"
                truncate
                variant="caption"
              >
                {change.detail}
              </Text>
            )}
          </Box>
          <Box
            flexShrink={0}
            ml="auto"
          >
            <Button
              aria-label={`Undo: ${change.rowId}`}
              size="s"
              variant="ghost"
              onClick={() => onUndo(change.id)}
            >
              Undo
            </Button>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default function PendingChangesFloatingPanelDemo(): ReactElement {
  const detailsId = useId()
  const titleId = useId()
  const [changes, setChanges] = useState(initialChanges)
  const [expanded, setExpanded] = useState(false)
  const [outcome, setOutcome] = useState('3 changes staged')

  const updates = changes.filter((change) => change.kind === 'update')
  const deletions = changes.filter((change) => change.kind === 'deletion')

  const reset = () => {
    setChanges(initialChanges)
    setExpanded(false)
    setOutcome('3 changes staged')
  }

  const clearChanges = (nextOutcome: string) => {
    setChanges([])
    setExpanded(false)
    setOutcome(nextOutcome)
  }

  const undo = (id: string) => {
    const remaining = changes.filter((change) => change.id !== id)
    setChanges(remaining)
    setOutcome(`${remaining.length} ${remaining.length === 1 ? 'change' : 'changes'} staged`)
  }

  return (
    <>
      <Box
        as="section"
        aria-labelledby={titleId}
        borderColor="subtle"
        borderStyle="solid"
        borderWidth={1}
        flexDirection="column"
        height="panel-height"
        width="full"
      >
        <Box
          alignItems="center"
          borderBottomWidth={1}
          borderColor="subtle"
          borderStyle="solid"
          justifyContent="between"
          padding="m"
        >
          <Box flexDirection="column">
            <Text
              id={titleId}
              variant="heading"
            >
              Accounts
            </Text>
            <Text
              color="muted"
              role="status"
            >
              {outcome}
            </Text>
          </Box>
          <Button
            size="s"
            variant="ghost"
            onClick={reset}
          >
            Reset demo
          </Button>
        </Box>
        <Box
          as="ul"
          flexDirection="column"
          width="full"
        >
          {['account_0001', 'account_0002', 'account_0003'].map((accountId) => (
            <Box
              as="li"
              key={accountId}
              borderBottomWidth={1}
              borderColor="subtle"
              borderStyle="solid"
              padding="m"
            >
              <Text>{accountId}</Text>
            </Box>
          ))}
        </Box>
      </Box>

      {changes.length === 0 ? null : (
        <FloatingPanel.Root aria-label="Pending changes">
          <FloatingPanel.Content size={expanded === true ? 'expanded' : 'compact'}>
            <FloatingPanel.Details open={expanded}>
              <Box
                as="section"
                aria-label="Affected rows"
                id={detailsId}
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
                    <Accordion.Item value="updates">
                      <Accordion.Header level={2}>
                        <Accordion.Trigger
                          aria-label={`Pending updates, ${updates.length}`}
                          suffix={
                            <Text
                              as="span"
                              color="muted"
                              tabularNums
                              variant="caption"
                            >
                              {updates.length}
                            </Text>
                          }
                        >
                          Pending updates
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Panel>
                        <ChangeList
                          changes={updates}
                          onUndo={undo}
                        />
                      </Accordion.Panel>
                    </Accordion.Item>
                  )}
                  {deletions.length === 0 ? null : (
                    <Accordion.Item value="deletions">
                      <Accordion.Header level={2}>
                        <Accordion.Trigger
                          aria-label={`Pending deletions, ${deletions.length}`}
                          suffix={
                            <Text
                              as="span"
                              color="muted"
                              tabularNums
                              variant="caption"
                            >
                              {deletions.length}
                            </Text>
                          }
                        >
                          Pending deletions
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Panel>
                        <ChangeList
                          changes={deletions}
                          onUndo={undo}
                        />
                      </Accordion.Panel>
                    </Accordion.Item>
                  )}
                </Accordion>
              </Box>
            </FloatingPanel.Details>
            <FloatingPanel.Summary>
              <Box
                flex={1}
                minWidth={0}
              >
                <Button
                  aria-controls={detailsId}
                  aria-expanded={expanded}
                  size="s"
                  variant="ghost"
                  onClick={() => setExpanded((current) => current === false)}
                >
                  Review pending changes
                </Button>
              </Box>
              <FloatingPanel.Actions>
                <Button
                  size="s"
                  variant="ghost"
                  onClick={() => clearChanges('Changes discarded')}
                >
                  Discard
                </Button>
                <Button
                  size="s"
                  onClick={() => clearChanges('Changes applied')}
                >
                  Apply changes
                </Button>
              </FloatingPanel.Actions>
            </FloatingPanel.Summary>
          </FloatingPanel.Content>
        </FloatingPanel.Root>
      )}
    </>
  )
}
