import { Button, Menu } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function LinkItemsExample(): ReactElement {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary" />}>Resources</Menu.Trigger>
      <Menu.Content>
        <Menu.LinkItem href="/components/menu">Menu documentation</Menu.LinkItem>
        <Menu.LinkItem href="https://base-ui.com/react/components/menu">
          Base UI reference
        </Menu.LinkItem>
      </Menu.Content>
    </Menu.Root>
  )
}
