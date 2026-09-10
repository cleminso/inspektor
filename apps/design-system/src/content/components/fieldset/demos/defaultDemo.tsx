import { Box, Field, Fieldset, Input } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function DefaultFieldsetDemo(): ReactElement {
  return (
    <Box width="popup-width-m">
      <Fieldset.Root>
        <Fieldset.Legend>Connection credentials</Fieldset.Legend>
        <Field.Root name="username">
          <Field.Label>Username</Field.Label>
          <Input
            autoComplete="username"
            fullWidth
          />
        </Field.Root>
        <Field.Root name="password">
          <Field.Label>Password</Field.Label>
          <Input
            type="password"
            autoComplete="current-password"
            fullWidth
          />
        </Field.Root>
      </Fieldset.Root>
    </Box>
  )
}
