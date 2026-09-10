import { Box, TextField } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function TextFieldDefaultDemo(): ReactElement {
  return (
    <Box width="popup-width-m">
      <TextField
        name="serverUrl"
        label="Server URL"
        type="url"
        placeholder="https://v2.sync.jazz.tools/"
        description="Sync server that stores your app data."
        autoComplete="url"
      />
    </Box>
  )
}
