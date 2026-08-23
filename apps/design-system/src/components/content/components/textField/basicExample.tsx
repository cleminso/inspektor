import { TextField } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    // TextField renders Field.Root, Field.Label, Input, Description, and Error internally.
    <TextField
      name="serverUrl"
      label="Server URL"
      description="Sync server that stores your app data."
      placeholder="https://v2.sync.jazz.tools/"
      required
    />
  )
}
