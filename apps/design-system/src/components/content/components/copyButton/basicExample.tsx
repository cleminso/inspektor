import { Box, CopyButton, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

const schemaHash = 'sha256:41f17cc82ca'

export default function BasicExample(): ReactElement {
  return (
    <Box
      alignItems="center"
      gap="xs"
    >
      <Text
        as="code"
        monospace
      >
        {schemaHash}
      </Text>
      <CopyButton
        textToCopy={schemaHash}
        label="Copy schema hash"
      />
    </Box>
  )
}
