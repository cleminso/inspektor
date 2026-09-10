import { Badge, Box, Button, ContextSwitcher, Text } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

interface Connection {
  id: string
  name: string
  appId: string
  environment: string
}

const connections: Connection[] = [
  { id: 'production', name: 'Production', appId: 'billing-app', environment: 'prod' },
  { id: 'staging', name: 'Staging', appId: 'billing-preview', environment: 'preview' },
  { id: 'analytics', name: 'Analytics', appId: 'metrics-app', environment: 'prod' },
  { id: 'support', name: 'Support', appId: 'support-tools', environment: 'internal' },
  { id: 'development', name: 'Development', appId: 'local-sandbox', environment: 'local' },
  { id: 'archive', name: 'Archive', appId: 'billing-archive', environment: 'read-only' },
]

export default function ConnectionContextSwitcherDemo(): ReactElement {
  const [connection, setConnection] = useState<Connection | null>(connections[0])

  return (
    <ContextSwitcher.Root<Connection>
      items={connections}
      value={connection}
      onValueChange={setConnection}
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
        <Text
          as="span"
          color="inherit"
          truncate
        >
          {connection?.name ?? 'Choose a connection'}
        </Text>
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Content>
        <ContextSwitcher.Search
          label="Search connections"
          placeholder="Search connections…"
        />
        <ContextSwitcher.Viewport maxHeight="fiveItems">
          <ContextSwitcher.Empty>No matching connections.</ContextSwitcher.Empty>
          <ContextSwitcher.List>
            {(item: Connection) => (
              <ContextSwitcher.Item
                key={item.id}
                value={item}
                description={item.appId}
                indicator="none"
              >
                <Box
                  as="span"
                  display="inline-flex"
                  minWidth={0}
                  alignItems="center"
                  gap="xxs"
                >
                  <Text
                    as="span"
                    color="inherit"
                    truncate
                  >
                    {item.name}
                  </Text>
                  <Badge
                    size="xs"
                    translate="no"
                  >
                    {item.environment}
                  </Badge>
                </Box>
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Viewport>
        <ContextSwitcher.Footer>
          <Button
            type="button"
            variant="ghost"
            size="s"
            layout="row"
          >
            Add connection
          </Button>
        </ContextSwitcher.Footer>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  )
}
