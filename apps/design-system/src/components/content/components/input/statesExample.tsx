import { Box, Input } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

export default function StatesExample(): ReactElement {
  const [value, setValue] = useState('Controlled value')

  return (
    <Box
      flexDirection="column"
      gap="l"
      width="full"
    >
      <Input
        aria-label="Controlled input"
        value={value}
        onValueChange={setValue}
        fullWidth
      />
      <Input
        aria-label="Invalid input"
        defaultValue="Invalid"
        invalid
        fullWidth
      />
      <Input
        aria-label="Read-only input"
        defaultValue="Read only"
        readOnly
        fullWidth
      />
      <Input
        aria-label="Disabled input"
        defaultValue="Disabled"
        disabled
        fullWidth
      />
    </Box>
  )
}
