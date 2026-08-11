import {
  ContextSwitcher,
  Text,
  type ContextSwitcherTriggerSize,
  type ContextSwitcherTriggerWidth,
} from '@inspector/ds'

import {
  useInspectorSessionState,
  useRuntimeSchemaHashes,
  useRuntimeSchemaHashesLoading,
} from '@app/providers/inspectorProvider'

interface SchemaSwitcherProps {
  size?: ContextSwitcherTriggerSize
  triggerLabel?: string
  width?: ContextSwitcherTriggerWidth
}

function truncateMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  const ellipsis = '…'
  const remainingLength = maxLength - ellipsis.length
  const startLength = Math.ceil(remainingLength / 2)
  const endLength = Math.floor(remainingLength / 2)

  return `${value.slice(0, startLength)}${ellipsis}${value.slice(value.length - endLength)}`
}

export function SchemaSwitcher({
  size = 's',
  triggerLabel,
  width = 'content',
}: SchemaSwitcherProps = {}): React.ReactElement {
  const { currentSchemaHash, switchSchema } = useInspectorSessionState()
  const availableSchemaHashes = useRuntimeSchemaHashes()
  const isSchemaHashesLoading = useRuntimeSchemaHashesLoading()
  const triggerText = triggerLabel ?? currentSchemaHash ?? 'Select schema'
  const triggerTitle = triggerLabel ?? currentSchemaHash ?? undefined
  const shouldTruncateCurrentSchema =
    currentSchemaHash !== null && triggerText === currentSchemaHash
  const displayTriggerText =
    shouldTruncateCurrentSchema === true ? truncateMiddle(currentSchemaHash, 24) : triggerText
  return (
    <ContextSwitcher.Root<string>
      items={availableSchemaHashes}
      value={currentSchemaHash}
      onValueChange={(schemaHash) => {
        if (schemaHash !== null) {
          void switchSchema(schemaHash)
        }
      }}
    >
      <ContextSwitcher.Trigger
        label="Switch schema"
        size={size}
        width={width}
        tooltip={triggerTitle}
      >
        <Text
          as="span"
          color="inherit"
          truncate
          translate="no"
        >
          {displayTriggerText}
        </Text>
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Content width="content">
        <ContextSwitcher.Search
          label="Search schemas"
          placeholder="Search schemas…"
        />
        <ContextSwitcher.Viewport maxHeight="l">
          {isSchemaHashesLoading === true ? (
            <ContextSwitcher.Status>Loading schemas…</ContextSwitcher.Status>
          ) : (
            <>
              <ContextSwitcher.Empty>No schemas available.</ContextSwitcher.Empty>
              <ContextSwitcher.List>
                {(schemaHash: string) => (
                  <ContextSwitcher.Item
                    key={schemaHash}
                    value={schemaHash}
                  >
                    <Text
                      as="span"
                      color="inherit"
                      translate="no"
                    >
                      {schemaHash}
                    </Text>
                  </ContextSwitcher.Item>
                )}
              </ContextSwitcher.List>
            </>
          )}
        </ContextSwitcher.Viewport>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  )
}
