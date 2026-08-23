import { Button, Menu } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function DefaultExample(): ReactElement {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary" />}>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => undefined}>Rename</Menu.Item>
        <Menu.Item onClick={() => undefined}>Duplicate</Menu.Item>
        <Menu.Separator />
        <Menu.Item
          variant="danger"
          onClick={() => undefined}
        >
          Delete
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  )
}
