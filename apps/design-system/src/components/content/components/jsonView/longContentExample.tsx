import { Box, JsonView } from '@inspektor/ds'

const record = {
  description: `A long value for checking wrapping in a narrow inspektor pane. ${'More detail. '.repeat(360)}`,
}

export default function LongContentExample() {
  return (
    <Box
      width="popup-width-s"
      minWidth={0}
    >
      <JsonView
        accessibilityLabel="Record with long content"
        data={record}
      />
    </Box>
  )
}
