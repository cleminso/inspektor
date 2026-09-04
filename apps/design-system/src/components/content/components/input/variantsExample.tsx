import { Box, Input } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function VariantsExample(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="m"
      width="popup-width-m"
    >
      <Input
        aria-label="Default input"
        placeholder="Default"
        fullWidth
      />
      <Input
        aria-label="Subtle input"
        placeholder="Subtle"
        variant="subtle"
        fullWidth
      />
    </Box>
  )
}
