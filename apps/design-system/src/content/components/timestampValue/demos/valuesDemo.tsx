import { Box, TimestampValue } from '@inspektor/ds'
import { type ReactElement } from 'react'

const epochMilliseconds = 1_705_329_000_000

export default function TimestampValueValuesDemo(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="m"
    >
      <TimestampValue value={new Date(epochMilliseconds)} />
      <TimestampValue value={epochMilliseconds} />
      <TimestampValue value={new Date(Number.NaN)} />
    </Box>
  )
}
