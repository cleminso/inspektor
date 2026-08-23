import { Field, Input } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function ValidationExample(): ReactElement {
  return (
    <Field.Root
      name="username"
      invalid
    >
      <Field.Label>Username</Field.Label>
      <Input
        defaultValue="inspector user"
        fullWidth
      />
      <Field.Error match>Use letters, numbers, or underscores.</Field.Error>
    </Field.Root>
  )
}
