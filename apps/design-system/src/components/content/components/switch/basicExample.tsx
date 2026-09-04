import { Field, Switch } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Field.Root>
      <Field.Label>
        <Switch />
        Insert more
      </Field.Label>
    </Field.Root>
  )
}
