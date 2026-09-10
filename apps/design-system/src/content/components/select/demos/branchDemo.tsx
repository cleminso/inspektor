import { Select } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const branches = [
  { label: 'Main', value: 'main' },
  { label: 'Develop', value: 'develop' },
  { label: 'Schema preview', value: 'schema-preview' },
] as const

type Branch = (typeof branches)[number]['value']

export default function SelectBranchDemo(): ReactElement {
  const [branch, setBranch] = useState<Branch>('main')

  return (
    <Select.Root
      items={branches}
      value={branch}
      onValueChange={(value) => {
        if (value !== null) setBranch(value)
      }}
    >
      <Select.Trigger
        aria-label="Branch"
        placeholder="Select a branch"
      />
      <Select.Content>
        {branches.map((option) => (
          <Select.Item
            key={option.value}
            value={option.value}
          >
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}
