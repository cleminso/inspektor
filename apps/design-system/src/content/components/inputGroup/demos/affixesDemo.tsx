import { Box, Input, InputGroup } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function InputGroupAffixesDemo(): ReactElement {
  return (
    <Box width="popup-width-m">
      <InputGroup fullWidth>
        <InputGroup.Prefix>https://</InputGroup.Prefix>
        <Input
          aria-label="Domain"
          defaultValue="example"
        />
        <InputGroup.Suffix>.com</InputGroup.Suffix>
      </InputGroup>
    </Box>
  )
}
