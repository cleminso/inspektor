import { Box, RelationValue, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function RelationValueValuesDemo(): ReactElement {
  return (
    <Box
      width="popup-width-s"
      flexDirection="column"
      gap="m"
    >
      <Box
        flexDirection="column"
        gap="xs"
      >
        <Text color="muted">Related record</Text>
        <RelationValue
          id="account_0123456789abcdefghijklmnopqrstuvwxyz"
          navigation={{ href: '#related-account' }}
        />
      </Box>
      <Box
        flexDirection="column"
        gap="xs"
      >
        <Text color="muted">Unavailable target</Text>
        <RelationValue id="account_42" />
      </Box>
    </Box>
  )
}
