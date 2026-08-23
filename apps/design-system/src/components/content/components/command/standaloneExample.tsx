import { Command } from '@inspector/ds'
import { type ReactElement } from 'react'

const items = [
  { label: 'Name', description: 'Text', keywords: ['profile'] },
  { label: 'Created at', description: 'Timestamp', keywords: ['date'] },
]

export default function StandaloneExample(): ReactElement {
  return (
    <Command.Root
      items={items}
      itemToStringLabel={(item) => item.label}
    >
      <Command.Input
        aria-label="Search columns"
        placeholder="Search columns"
      />
      <Command.List>
        {items.map((item) => (
          <Command.Item
            key={item.label}
            value={item}
          >
            <Command.ItemText
              label={item.label}
              description={item.description}
            />
          </Command.Item>
        ))}
      </Command.List>
    </Command.Root>
  )
}
