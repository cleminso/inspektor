import { Box, Field, Input } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function DefaultFieldDemo(): ReactElement {
  return (
    <Box width="popup-width-m">
      <Field.Root name="email">
        <Field.Label>Email</Field.Label>
        <Input
          type="email"
          fullWidth
        />
        <Field.Description>Used for connection notifications.</Field.Description>
      </Field.Root>
    </Box>
  )
}
