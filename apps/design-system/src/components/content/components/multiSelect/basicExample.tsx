import { MultiSelect, type MultiSelectItem } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const options: readonly MultiSelectItem[] = [
  { value: 'design-system', label: 'Design System', disabled: true },
  { value: 'components', label: 'Components' },
  { value: 'design-tokens', label: 'Design Tokens' },
]

export default function BasicExample(): ReactElement {
  const [value, setValue] = useState(['design-system', 'components'])
  const triggerLabel =
    value.length === options.length
      ? 'All options selected'
      : value.length === 1
        ? (options.find((option) => option.value === value[0])?.label ?? '1 option selected')
        : `${value.length} options selected`

  return (
    <MultiSelect.Root
      items={options}
      value={value}
      onValueChange={setValue}
    >
      <MultiSelect.Trigger label="Choose options">{triggerLabel}</MultiSelect.Trigger>
      <MultiSelect.Content label="Options" />
    </MultiSelect.Root>
  )
}
