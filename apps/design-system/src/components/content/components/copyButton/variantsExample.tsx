import { Box, CopyButton } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function VariantsExample(): ReactElement {
  return (
    <Box
      alignItems="center"
      gap="m"
    >
      <CopyButton
        textToCopy="Ghost action"
        label="Copy ghost action"
        variant="ghost"
      />
      <CopyButton
        textToCopy="Secondary action"
        label="Copy secondary action"
        variant="secondary"
      />
    </Box>
  )
}
