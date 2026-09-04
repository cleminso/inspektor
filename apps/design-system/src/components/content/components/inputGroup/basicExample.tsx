import { Input, InputGroup } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <InputGroup fullWidth>
      <InputGroup.Prefix>https://</InputGroup.Prefix>
      <Input
        aria-label="Domain"
        placeholder="example"
      />
      <InputGroup.Suffix>.com</InputGroup.Suffix>
    </InputGroup>
  )
}
