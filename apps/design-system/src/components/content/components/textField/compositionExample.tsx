import { Field, Input } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function CompositionExample(): ReactElement {
  return (
    // This is the manual equivalent of TextField for custom structures.
    <Field.Root name="serverUrl">
      <Field.Label>Server URL</Field.Label>
      <Input
        placeholder="https://v2.sync.jazz.tools/"
        required
        fullWidth
      />
      <Field.Description>Sync server that stores your app data.</Field.Description>
      <Field.Error />
    </Field.Root>
  )
}
