import { Box, Switch } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

export default function SwitchDefaultDemo(): ReactElement {
  const [enabled, setEnabled] = useState(false)

  return (
    <Box
      alignItems="center"
      gap="l"
    >
      <Switch
        aria-label="Show system tables"
        size="s"
        checked={enabled}
        onCheckedChange={(checked) => setEnabled(checked === true)}
      />
      <Switch
        aria-label="Show system tables"
        size="m"
        checked={enabled}
        onCheckedChange={(checked) => setEnabled(checked === true)}
      />
    </Box>
  )
}
