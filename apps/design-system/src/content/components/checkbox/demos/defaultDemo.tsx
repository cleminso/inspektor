import { Box, Checkbox } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

export default function CheckboxDefaultDemo(): ReactElement {
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
        />
        Option 1
      </Checkbox.Label>
    </Box>
  )
}
