import { Box, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function TextRolesDemo(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="m"
    >
      <Text variant="heading">Connection details</Text>
      <Text variant="title">Production database</Text>
      <Text variant="body">Inspect schemas and records without changing application data.</Text>
      <Text variant="label">Connection name</Text>
      <Text
        variant="caption"
        color="muted"
      >
        Read-only connection
      </Text>
    </Box>
  )
}
