import { Box, Spinner } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function SpinnerSizesDemo(): ReactElement {
  return (
    <Box
      alignItems="center"
      gap="l"
    >
      <Spinner
        label="Loading control"
        size="s"
      />
      <Spinner label="Loading panel" />
      <Spinner
        label="Loading application"
        size="l"
      />
    </Box>
  )
}
