import { Field, Textarea } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Field.Root>
      <Field.Label>JSON value</Field.Label>
      <Textarea
        font="mono"
        placeholder='{ "enabled": true }'
      />
      <Field.Description>Enter a JSON object for this column.</Field.Description>
      <Field.Error />
    </Field.Root>
  )
}
