import { Box, RelationDetails, RelationValue } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="l"
      width="full"
    >
      <RelationValue
        id="account_0123456789"
        navigation={{ href: '#relation-target' }}
      />
      <RelationDetails
        id="account_0123456789"
        navigation={{ href: '#relation-target' }}
        state={{ status: 'resolved', displayValue: 'Ada Lovelace' }}
      />
    </Box>
  )
}
