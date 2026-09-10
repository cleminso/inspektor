import { Box, ContextMenu, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function SubMenuItemsContextMenuDemo(): ReactElement {
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
        <ContextMenu.SubmenuRoot>
          <ContextMenu.SubmenuTrigger>Move column</ContextMenu.SubmenuTrigger>
          <ContextMenu.Content
            side="right"
            align="start"
          >
            <ContextMenu.Item onClick={() => undefined}>Move left</ContextMenu.Item>
            <ContextMenu.Item onClick={() => undefined}>Move right</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item onClick={() => undefined}>Move to first column</ContextMenu.Item>
            <ContextMenu.Item onClick={() => undefined}>Move to last column</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.SubmenuRoot>
        <ContextMenu.Separator />
        <ContextMenu.Item onClick={() => undefined}>Hide column</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
