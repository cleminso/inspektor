import { Combobox } from '@inspektor/ds'
import { type ReactElement } from 'react'

const branches = ['main', 'develop', 'feature/schema-view']

export default function TriggerExample(): ReactElement {
  return (
    <Combobox.Root
      items={branches}
      defaultValue="main"
    >
      <Combobox.Trigger
        size="m"
        width="content"
      >
        <Combobox.Value placeholder="Select branch" />
      </Combobox.Trigger>
      <Combobox.Content>
        <Combobox.List>
          {(branch: string) => (
            <Combobox.Item
              key={branch}
              value={branch}
            >
              {branch}
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Content>
    </Combobox.Root>
  )
}
