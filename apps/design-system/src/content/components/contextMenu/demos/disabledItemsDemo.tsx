import { Box, ContextMenu, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function DisabledItemsContextMenuDemo(): ReactElement {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        render={
          <Box
            width="example-width"
            height="example-height"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderWidth={1}
            borderStyle="dashed"
            borderColor="default"
            borderRadius="s"
          />
        }
      >
        <Text variant="body">Right click here</Text>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item onClick={() => undefined}>Open table</ContextMenu.Item>
        <ContextMenu.Item
          disabled
          onClick={() => undefined}
        >
          Rename table
        </ContextMenu.Item>
        <ContextMenu.Item
          disabled
          onClick={() => undefined}
        >
          Duplicate table
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item
          variant="danger"
          onClick={() => undefined}
        >
          Delete table
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
