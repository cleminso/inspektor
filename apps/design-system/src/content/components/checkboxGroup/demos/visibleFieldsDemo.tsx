import { CheckboxGroup, type CheckboxGroupItem } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const fields: readonly CheckboxGroupItem[] = [
  { value: 'id', label: 'ID', disabled: true },
  { value: 'name', label: 'Name' },
  { value: 'role', label: 'Role' },
]

export default function VisibleFieldsDemo(): ReactElement {
  const [value, setValue] = useState(['id', 'role'])

  return (
    <CheckboxGroup.Root
      items={fields}
      value={value}
      onValueChange={setValue}
    >
      <CheckboxGroup.List label="Visible fields" />
    </CheckboxGroup.Root>
  )
}
