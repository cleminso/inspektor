import { Box, Switch } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function SwitchDisabledDemo(): ReactElement {
  return (
    <Box
      alignItems="center"
      gap="l"
    >
      <Switch
        aria-label="Unavailable setting"
        size="m"
        disabled
      />
      <Switch
        aria-label="Read-only setting"
        size="m"
        defaultChecked
        readOnly
      />
    </Box>
  )
}
