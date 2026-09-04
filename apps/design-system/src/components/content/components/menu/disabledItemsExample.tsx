import { Button, Menu } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function DisabledItemsExample(): ReactElement {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary" />}>Connection actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => undefined}>Reconnect</Menu.Item>
        <Menu.Item disabled>Pause sync</Menu.Item>
        <Menu.Item
          disabled
          variant="danger"
        >
          Delete active connection
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  )
}
