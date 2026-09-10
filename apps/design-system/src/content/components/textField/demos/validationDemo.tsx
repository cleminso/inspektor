import { Box, TextField } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function TextFieldValidationDemo(): ReactElement {
  return (
    <Box
      width="popup-width-m"
      flexDirection="column"
      gap="l"
    >
      <TextField
        name="databaseName"
        label="Database name"
        defaultValue="production data"
        error="Use letters, numbers, hyphens, or underscores."
      />
      <TextField
        name="connectionId"
        label="Connection ID"
        defaultValue="co_zM4x8gH2"
        font="mono"
        readOnly
        variant="subtle"
        size="s"
      />
    </Box>
  )
}
