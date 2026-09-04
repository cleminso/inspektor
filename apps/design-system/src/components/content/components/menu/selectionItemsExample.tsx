import { Button, Menu } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

export default function SelectionItemsExample(): ReactElement {
  const [showSystemTables, setShowSystemTables] = useState(false)
  const [density, setDensity] = useState('comfortable')

  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary" />}>Table options</Menu.Trigger>
      <Menu.Content>
        <Menu.CheckboxItem
          checked={showSystemTables}
          onCheckedChange={setShowSystemTables}
        >
          <Menu.CheckboxItemIndicator />
          Show system tables
        </Menu.CheckboxItem>
        <Menu.Separator />
        <Menu.Group>
          <Menu.GroupLabel>Density</Menu.GroupLabel>
          <Menu.RadioGroup
            value={density}
            onValueChange={setDensity}
          >
            <Menu.RadioItem value="compact">
              <Menu.RadioItemIndicator />
              Compact
            </Menu.RadioItem>
            <Menu.RadioItem value="comfortable">
              <Menu.RadioItemIndicator />
              Comfortable
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Group>
      </Menu.Content>
    </Menu.Root>
  )
}
