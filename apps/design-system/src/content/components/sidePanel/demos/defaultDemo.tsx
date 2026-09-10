import { Box, SidePanel, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

const tables = [
  'accounts',
  'audit_events',
  'connections',
  'customers',
  'feature_flags',
  'invoices',
  'memberships',
  'organizations',
  'payment_methods',
  'sessions',
  'subscriptions',
  'users',
] as const

export default function SidePanelDefaultDemo(): ReactElement {
  return (
    <Box
      width="popup-width-m"
      height="panel-height"
    >
      <SidePanel aria-label="Available tables">
        <SidePanel.Header>
          <Text
            as="h2"
            variant="label"
          >
            Tables
          </Text>
        </SidePanel.Header>
        <SidePanel.Body>
          <Box
            as="ul"
            display="flex"
            flexDirection="column"
            gap="m"
          >
            {tables.map((table) => (
              <Box
                as="li"
                key={table}
              >
                <Text as="span">{table}</Text>
              </Box>
            ))}
          </Box>
        </SidePanel.Body>
        <SidePanel.Footer>
          <Text
            variant="caption"
            color="muted"
            tabularNums
          >
            {tables.length} tables
          </Text>
        </SidePanel.Footer>
      </SidePanel>
    </Box>
  )
}
