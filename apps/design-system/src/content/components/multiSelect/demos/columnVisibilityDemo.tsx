import { MultiSelect, type MultiSelectItem } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const columns: readonly MultiSelectItem[] = [
  { value: 'id', label: 'ID', disabled: true },
  { value: 'name', label: 'Name' },
  { value: 'created-at', label: 'Created at' },
]

function getSummary(value: readonly string[]): string {
  if (value.length === columns.length) return 'All columns visible'
  if (value.length === 1) return '1 column visible'
  return `${value.length} columns visible`
}

export default function MultiSelectColumnVisibilityDemo(): ReactElement {
  const [value, setValue] = useState(['id', 'name'])

  return (
    <MultiSelect.Root
      items={columns}
      value={value}
      onValueChange={setValue}
    >
      <MultiSelect.Trigger label="Choose visible columns">{getSummary(value)}</MultiSelect.Trigger>
      <MultiSelect.Content
        label="Visible columns"
        width="m"
        maxHeight="m"
      />
    </MultiSelect.Root>
  )
}
