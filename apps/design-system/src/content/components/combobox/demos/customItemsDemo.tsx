import { Box, Combobox, Field } from '@inspektor/ds'
import { type ReactElement } from 'react'

interface Connection {
  id: string
  name: string
  appId: string
}

const connections: Connection[] = [
  { id: 'production', name: 'Production', appId: 'inventory-app' },
  { id: 'staging', name: 'Staging', appId: 'inventory-preview' },
  { id: 'development', name: 'Development', appId: 'local-sandbox' },
]

export default function CustomItemsDemo(): ReactElement {
  return (
    <Box width="popup-width-m">
      <Field.Root name="connection">
        <Field.Label>Connection</Field.Label>
        <Combobox.Root<Connection>
          items={connections}
          defaultValue={connections[0]}
          itemToStringLabel={(connection) => connection.name}
          itemToStringValue={(connection) => connection.id}
          isItemEqualToValue={(connection, selected) => connection.id === selected.id}
          filter={(connection, query) =>
            `${connection.name} ${connection.appId}`
              .toLowerCase()
              .includes(query.trim().toLowerCase())
          }
        >
          <Combobox.InputGroup width="full">
            <Combobox.Input placeholder="Find a connection" />
            <Combobox.Clear label="Clear connection" />
            <Combobox.InputTrigger />
          </Combobox.InputGroup>
          <Combobox.Content>
            <Combobox.Viewport maxHeight="fiveItems">
              <Combobox.Empty>No connections found.</Combobox.Empty>
              <Combobox.List>
                {(connection: Connection) => (
                  <Combobox.Item
                    key={connection.id}
                    value={connection}
                    description={connection.appId}
                  >
                    {connection.name}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Viewport>
          </Combobox.Content>
        </Combobox.Root>
      </Field.Root>
    </Box>
  )
}
