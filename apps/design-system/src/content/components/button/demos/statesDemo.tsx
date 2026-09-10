import { Box, Button } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function ButtonStatesDemo(): ReactElement {
  return (
    <Box
      alignItems="center"
      flexWrap="wrap"
      gap="m"
    >
      <Button loading>Saving changes</Button>
      <Button disabled>Save changes</Button>
    </Box>
  )
}
