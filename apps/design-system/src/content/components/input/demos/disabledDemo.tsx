import { Box, Field, Input } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function DefaultInputDemo(): ReactElement {
  return (
    <Box width="popup-width-m">
      <Field.Root name="disabled">
        <Field.Label>Small</Field.Label>
        <Input
          type="text"
          size="s"
          autoComplete="disabled"
          fullWidth
          disabled
        />
      </Field.Root>
    </Box>
  )
}
