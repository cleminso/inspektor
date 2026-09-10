import { Box, Button } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function ButtonVariantsDemo(): ReactElement {
  return (
    <Box
      alignItems="center"
      flexWrap="wrap"
      gap="m"
    >
      <Button>Save changes</Button>
      <Button variant="secondary">Preview</Button>
      <Button variant="danger">Delete connection</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="link">View details</Button>
    </Box>
  )
}
