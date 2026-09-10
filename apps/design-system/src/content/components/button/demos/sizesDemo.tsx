import { Box, Button } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function ButtonSizesDemo(): ReactElement {
  return (
    <Box
      alignItems="center"
      flexWrap="wrap"
      gap="m"
    >
      <Button size="xs">Extra small</Button>
      <Button size="s">Small</Button>
      <Button size="m">Medium</Button>
    </Box>
  )
}
