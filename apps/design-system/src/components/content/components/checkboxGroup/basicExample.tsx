import { CheckboxGroup, type CheckboxGroupItem } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const items: readonly CheckboxGroupItem[] = [
  { value: 'id', label: 'ID', disabled: true },
  { value: 'name', label: 'Name' },
  { value: 'role', label: 'Role' },
]

export default function BasicExample(): ReactElement {
  const [value, setValue] = useState(['id', 'name'])

  return (
    <CheckboxGroup.Root
      items={items}
      value={value}
      onValueChange={setValue}
    >
      <CheckboxGroup.List label="Visible fields" />
    </CheckboxGroup.Root>
  )
}
