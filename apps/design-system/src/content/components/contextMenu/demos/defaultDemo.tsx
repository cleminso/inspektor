import { Box, ContextMenu, Text } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

export default function DefaultContextMenuDemo(): ReactElement {
  const [showDetails, setShowDetails] = useState(true)

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
        <ContextMenu.CheckboxItem
          checked={showDetails}
          onCheckedChange={setShowDetails}
        >
          Show details
          <ContextMenu.CheckboxItemIndicator />
        </ContextMenu.CheckboxItem>
        <ContextMenu.Separator />
        <ContextMenu.Item
          variant="danger"
          onClick={() => undefined}
        >
          Close tab
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
