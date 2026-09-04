import { Box, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Box
      as="section"
      flexDirection="column"
      gap="m"
      padding="l"
      borderWidth={1}
      borderStyle="solid"
      borderColor="default"
      borderRadius="s"
    >
      <Text
        as="h2"
        variant="label"
      >
        Layout region
      </Text>
      <Box
        maxHeight="viewport-height-s"
        overflow="auto"
      >
        <Text color="muted">Box keeps layout and surface choices inside the token system.</Text>
      </Box>
    </Box>
  )
}
