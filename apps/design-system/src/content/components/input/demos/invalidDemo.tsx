import { Box, Field, Input } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function DefaultInputDemo(): ReactElement {
  return (
    <Box width="popup-width-m">
      <Field.Root name="invalidValue" invalid>
        <Field.Label>Invalid Value</Field.Label>
        <Input
          defaultValue="invalid-url"
          size="s"
          fullWidth
        />
        <Field.Error match>Enter a valid connection URL.</Field.Error>
      </Field.Root>
    </Box>
  )
}

<Field.Root
        name="invalidValue"
        invalid
      >
        <Field.Label>Connection URL</Field.Label>
        <Input
          defaultValue="invalid-url"
          fullWidth
        />

      </Field.Root>
