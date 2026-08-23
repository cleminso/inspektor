import { ContextMenu } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function DefaultExample(): ReactElement {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>Right-click this tab</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item onClick={() => undefined}>Rename tab</ContextMenu.Item>
        <ContextMenu.Item onClick={() => undefined}>Duplicate tab</ContextMenu.Item>
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
