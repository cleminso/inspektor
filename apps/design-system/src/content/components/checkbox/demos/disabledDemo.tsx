import { Box, Checkbox } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function CheckboxDisabledDemo(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="m"
    >
      <Checkbox.Label>
        <Checkbox disabled />
        Disabled
      </Checkbox.Label>
      <Checkbox.Label>
        <Checkbox
          checked
          disabled
        />
        Disabled checked
      </Checkbox.Label>
      <Checkbox.Label>
        <Checkbox
          disabled
          indeterminate
        />
        Disabled indeterminate
      </Checkbox.Label>
    </Box>
  )
}
