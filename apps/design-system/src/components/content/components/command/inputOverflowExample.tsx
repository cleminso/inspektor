import { Button, Command, DataGridFilterClause } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const clauses = [
  ['createdAt', '>', '2026-08-19'],
  ['session_user_id', '!=', '03c905ac-d9a8-4f40'],
  ['provider_instance_id', '=', 'analytics-production'],
] as const

const items = [{ label: 'id' }, { label: 'room_id' }, { label: 'createdAt' }]

export default function InputOverflowExample(): ReactElement {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open command with filter drafts</Button>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <Command.Title>Choose another filter column</Command.Title>
        <Command.Root
          autoHighlight={false}
          items={items}
          itemToStringLabel={(item) => item.label}
        >
          <Command.InputRow aria-label="Filter drafts with overflow">
            {clauses.map(([column, operator, value]) => (
              <DataGridFilterClause.Root key={column}>
                <DataGridFilterClause.Trigger
                  aria-label={`Edit draft filter ${column} ${operator} ${value}`}
                >
                  <DataGridFilterClause.Column>{column}</DataGridFilterClause.Column>
                  <DataGridFilterClause.Operator>{operator}</DataGridFilterClause.Operator>
                  <DataGridFilterClause.Value>{value}</DataGridFilterClause.Value>
                </DataGridFilterClause.Trigger>
                <DataGridFilterClause.Remove
                  aria-label={`Remove draft filter ${column} ${operator} ${value}`}
                />
              </DataGridFilterClause.Root>
            ))}
            <Command.Input aria-label="Filter columns" />
          </Command.InputRow>
          <Command.List>
            <Command.Group>
              <Command.GroupLabel>Columns</Command.GroupLabel>
              {items.map((item) => (
                <Command.Item
                  key={item.label}
                  value={item}
                >
                  <Command.ItemText label={item.label} />
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command.Root>
        <Command.Close />
      </Command.Dialog>
    </>
  )
}
