import { Button, Menu } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

export default function MenuActionsDemo(): ReactElement {
  const [showDetails, setShowDetails] = useState(true)

  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary" />}>Record actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => undefined}>Rename record</Menu.Item>
        <Menu.CheckboxItem
          checked={showDetails}
          onCheckedChange={setShowDetails}
        >
          Show details
          <Menu.CheckboxItemIndicator />
        </Menu.CheckboxItem>
        <Menu.Separator />
        <Menu.Item
          variant="danger"
          onClick={() => undefined}
        >
          Delete record
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  )
}
