import { Badge, Box } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function BadgeSizesDemo(): ReactElement {
  return (
    <Box
      alignItems="center"
      gap="m"
    >
      <Badge size="s">Latest</Badge>
      <Badge size="xs">prod</Badge>
    </Box>
  )
}
