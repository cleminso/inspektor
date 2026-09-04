import { Checkbox } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Checkbox.Label>
      <Checkbox
        name="notifications"
        defaultChecked
      />
      Enable notifications
    </Checkbox.Label>
  )
}
