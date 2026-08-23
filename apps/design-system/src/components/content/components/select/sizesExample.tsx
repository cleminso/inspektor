import { Box, Select } from '@inspector/ds'
import { type ReactElement } from 'react'

const sizes = ['xs', 's', 'm', 'l'] as const
const items = [
  { label: 'Local', value: 'local' },
  { label: 'Production', value: 'production' },
]

export default function SizesExample(): ReactElement {
  return (
    <Box
      gap="m"
      alignItems="center"
      flexWrap="wrap"
    >
      {sizes.map((size) => (
        <Select.Root
          key={size}
          items={items}
          defaultValue="local"
        >
          <Select.Trigger
            size={size}
            aria-label={`${size.toUpperCase()} environment`}
          />
          <Select.Content>
            {items.map((item) => (
              <Select.Item
                key={item.value}
                value={item.value}
              >
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      ))}
    </Box>
  )
}
