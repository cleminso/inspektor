import { Box, Checkbox } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

export default function CheckboxIndeterminateDemo(): ReactElement {
  const [checked, setChecked] = useState(false)

  return (
    <Box
      flexDirection="column"
      gap="m"
    >
      <Checkbox.Label>
        <Checkbox
          checked={checked}
          onCheckedChange={(nextChecked) => setChecked(nextChecked === true)}
          indeterminate
        />
        option 1
      </Checkbox.Label>
    </Box>
  )
}
