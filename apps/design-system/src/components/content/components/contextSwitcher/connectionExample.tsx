import { Button, ContextSwitcher } from '@inspector/ds'
import { type ReactElement, useState } from 'react'

interface Connection {
  id: string
  name: string
  appId: string
}

const connections: Connection[] = [
  { id: 'storefront', name: 'Storefront', appId: 'storefront-production' },
  { id: 'dashboard', name: 'Dashboard', appId: 'dashboard-development' },
  { id: 'sandbox', name: 'Sandbox', appId: 'local-sandbox' },
]

export default function ConnectionExample(): ReactElement {
  const [connection, setConnection] = useState<Connection | null>(connections[0] ?? null)
  const [open, setOpen] = useState(false)

  return (
    <ContextSwitcher.Root
      items={connections}
      value={connection}
      onValueChange={setConnection}
      open={open}
      onOpenChange={setOpen}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(item, selected) => item.id === selected.id}
      filter={(item, query) =>
        `${item.name} ${item.appId}`.toLowerCase().includes(query.trim().toLowerCase())
      }
    >
      <ContextSwitcher.Trigger
        label="Switch connection"
        width="m"
      >
        <ContextSwitcher.Value placeholder="Open connections" />
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Content width="m">
        <ContextSwitcher.Search
          label="Search connections"
          placeholder="Search connections"
        />
        <ContextSwitcher.Viewport>
          <ContextSwitcher.Empty>No saved connections.</ContextSwitcher.Empty>
          <ContextSwitcher.List>
            {(item: Connection) => (
              <ContextSwitcher.Item
                key={item.id}
                value={item}
              >
                <ContextSwitcher.ItemText
                  label={item.name}
                  description={item.appId}
                />
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Viewport>
        <ContextSwitcher.Footer>
          <Button
            variant="ghost"
            size="s"
            layout="row"
            onClick={() => setOpen(false)}
          >
            Add new connection
          </Button>
        </ContextSwitcher.Footer>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  )
}
