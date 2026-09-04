import { Box, Icon } from '@inspektor/ds'
import { Activity, Table } from 'lucide-react'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Box
      alignItems="center"
      gap="l"
    >
      <Icon
        artwork={Table}
        size="xs"
      />
      <Icon
        artwork={Activity}
        size="s"
      />
      <Icon
        artwork={Table}
        size="m"
      />
    </Box>
  )
}
