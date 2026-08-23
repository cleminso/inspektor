import { Box, Combobox, Text } from '@inspector/ds'
import { type ReactElement } from 'react'

const branches = ['main', 'develop', 'feature/schema-view']
const widths = ['s', 'm', 'l'] as const

export default function SizesExample(): ReactElement {
  return (
    <Box
      gap="l"
      alignItems="end"
      flexWrap="wrap"
    >
      {widths.map((width) => (
        <Box
          key={width}
          flexDirection="column"
          gap="xs"
          alignItems="start"
        >
          <Text variant="caption">{width.toUpperCase()}</Text>
          <Combobox.Root items={branches}>
            <Combobox.InputGroup>
              <Combobox.Input
                aria-label={`${width} branch picker`}
                placeholder="Find a branch"
              />
              <Combobox.InputTrigger />
            </Combobox.InputGroup>
            <Combobox.Content width={width}>
              <Combobox.Viewport>
                <Combobox.List>
                  {(branch: string) => (
                    <Combobox.Item
                      key={branch}
                      value={branch}
                    >
                      {branch}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Viewport>
            </Combobox.Content>
          </Combobox.Root>
        </Box>
      ))}
    </Box>
  )
}
