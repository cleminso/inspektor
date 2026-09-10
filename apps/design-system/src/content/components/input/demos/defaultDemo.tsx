import { Box, Field, Input } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function DefaultInputDemo(): ReactElement {
  return (
    <Box width="popup-width-m" flexDirection="row" gap="m">
      <Field.Root name="extraSamll">
        <Field.Label>Extra small</Field.Label>
        <Input
          type="text"
          size="xs"
          autoComplete="extraSmall"
          fullWidth
        />
      </Field.Root>
      <Field.Root name="email">
        <Field.Label>Small</Field.Label>
        <Input
          type="text"
          size="s"
          autoComplete="small"
          fullWidth
        />
      </Field.Root>
    </Box>
  )
}
