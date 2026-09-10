import { Box, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function LayoutRegionDemo(): ReactElement {
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
        Query details
      </Text>
      <Text color="muted">Inspect the selected operation and its variables.</Text>
    </Box>
  )
}
