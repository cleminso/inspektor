import { Box, Field, Input } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function FieldErrorDemo(): ReactElement {
  return (
    <Box width="popup-width-m">
      <Field.Root
        name="email"
        invalid
      >
        <Field.Label>Email</Field.Label>
        <Input
          type="email"
          defaultValue="invalid-address"
          fullWidth
        />
        <Field.Error match>Enter a valid email address.</Field.Error>
      </Field.Root>
    </Box>
  )
}
