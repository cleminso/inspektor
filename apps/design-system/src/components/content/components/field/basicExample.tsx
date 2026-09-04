import { Field, Input } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Field.Root name="email">
      <Field.Label>Email</Field.Label>
      <Input
        type="email"
        placeholder="name@example.com"
        fullWidth
      />
      <Field.Description>Used for account notifications.</Field.Description>
    </Field.Root>
  )
}
