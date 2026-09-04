import {
  Badge,
  Box,
  ContextSwitcher,
  Text,
  Tooltip,
  type ContextSwitcherTriggerSize,
  type ContextSwitcherTriggerWidth,
} from '@inspektor/ds'

import { useInspectorSessionState, useRuntimeSchemaHashes } from '@app/providers/inspectorProvider'

interface SchemaSwitcherProps {
  size?: ContextSwitcherTriggerSize
  triggerLabel?: string
  width?: ContextSwitcherTriggerWidth
}

function shortSchemaHash(hash: string): string {
  return hash.slice(0, 12)
}

export function SchemaSwitcher({
  size = 's',
  triggerLabel,
  width = 'content',
}: SchemaSwitcherProps = {}): React.ReactElement {
  const { currentSchemaHash, switchSchema } = useInspectorSessionState()
  const availableSchemaHashes = useRuntimeSchemaHashes()
  const latestSchemaHash = availableSchemaHashes[0] ?? null
  const isLatestSchema = currentSchemaHash === latestSchemaHash
  const displayTriggerText =
    triggerLabel ??
    (currentSchemaHash === null ? 'Select schema' : shortSchemaHash(currentSchemaHash))
  return (
    <Box
      minWidth={0}
      alignItems="center"
      gap="xxs"
    >
      <ContextSwitcher.Root<string>
        items={availableSchemaHashes}
        value={currentSchemaHash}
        onValueChange={(schemaHash) => {
          if (schemaHash !== null) {
            switchSchema(schemaHash)
          }
        }}
      >
        <ContextSwitcher.Trigger
          label={
            currentSchemaHash === null ? 'Switch schema' : `Switch schema: ${currentSchemaHash}`
          }
          size={size}
          width={width}
        >
          <Text
            as="span"
            color="inherit"
            truncate
            tabularNums
            translate="no"
          >
            {displayTriggerText}
          </Text>
        </ContextSwitcher.Trigger>
        <ContextSwitcher.Content width="content">
          {availableSchemaHashes.length > 10 ? (
            <ContextSwitcher.Search
              label="Search schemas"
              placeholder="Search schemas…"
            />
          ) : null}
          <ContextSwitcher.Viewport maxHeight="l">
            <ContextSwitcher.Empty>No schemas available.</ContextSwitcher.Empty>
            <ContextSwitcher.List>
              {(schemaHash: string) => {
                const isLatest = schemaHash === latestSchemaHash
                const status = isLatest === true ? 'Latest' : 'Older'
                const item = (
                  <ContextSwitcher.Item
                    key={schemaHash}
                    aria-label={`${schemaHash}, ${status}`}
                    value={schemaHash}
                  >
                    <Text
                      as="span"
                      color="inherit"
                      tabularNums
                      translate="no"
                      truncate
                    >
                      {shortSchemaHash(schemaHash)}
                    </Text>
                  </ContextSwitcher.Item>
                )
                return (
                  <Tooltip.Root key={schemaHash}>
                    <Tooltip.Trigger
                      closeDelay={100}
                      render={item}
                    />
                    <Tooltip.Content side="right">{status}</Tooltip.Content>
                  </Tooltip.Root>
                )
              }}
            </ContextSwitcher.List>
          </ContextSwitcher.Viewport>
        </ContextSwitcher.Content>
      </ContextSwitcher.Root>
      {latestSchemaHash === null || currentSchemaHash === null ? null : (
        <Badge>{isLatestSchema === true ? 'Latest' : 'Older'}</Badge>
      )}
    </Box>
  )
}
