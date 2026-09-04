import { Button, Command } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const actions = [
  { label: 'Open table', description: 'Browse rows', keywords: ['data'] },
  { label: 'Inspect schema', description: 'View columns', keywords: ['types'] },
]

export default function BasicExample(): ReactElement {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open command</Button>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <Command.Title>Choose an action</Command.Title>
        <Command.Root
          items={actions}
          itemToStringLabel={(item) => item.label}
        >
          <Command.InputRow aria-label="Command query">
            <Command.Input
              aria-label="Search actions"
              placeholder="Search actions"
            />
          </Command.InputRow>
          <Command.List>
            <Command.Empty>No actions found.</Command.Empty>
            {actions.map((action) => (
              <Command.Item
                key={action.label}
                value={action}
                onClick={() => setOpen(false)}
              >
                <Command.ItemText
                  label={action.label}
                  description={action.description}
                />
              </Command.Item>
            ))}
          </Command.List>
          <Command.Footer>
            <span>
              <Command.Key>↑ ↓</Command.Key> Navigate
            </span>
            <span>
              <Command.Key>Enter</Command.Key> Select
            </span>
            <span>
              <Command.Key>Esc</Command.Key> Cancel
            </span>
          </Command.Footer>
        </Command.Root>
        <Command.Close />
      </Command.Dialog>
    </>
  )
}
