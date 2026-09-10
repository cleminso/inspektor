import { Box, Field, Input } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function InputVariantsDemo(): ReactElement {
  return (
    <Box
      width="popup-width-m"
      flexDirection="column"
      gap="m"
    >
      <Field.Root name="rowId">
        <Field.Label>Row ID</Field.Label>
        <Input
          defaultValue="account_0001"
          font="mono"
          size="m"
          fullWidth
        />
      </Field.Root>
      <Field.Root name="readOnlyValue">
        <Field.Label>Generated value</Field.Label>
        <Input
          defaultValue="Computed by the source"
          variant="subtle"
          readOnly
          fullWidth
        />
      </Field.Root>

    </Box>
  )
}
