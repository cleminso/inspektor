import { Box, Combobox, Spinner } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function StatusExample(): ReactElement {
  return (
    <Box
      gap="l"
      alignItems="start"
      flexWrap="wrap"
    >
      <Combobox.Root
        items={[]}
        defaultOpen
      >
        <Combobox.InputGroup>
          <Combobox.Input
            aria-label="Loading tables"
            placeholder="Find a table"
          />
          <Combobox.InputTrigger />
        </Combobox.InputGroup>
        <Combobox.Content width="s">
          <Combobox.Viewport>
            <Combobox.Status>
              <Box
                alignItems="center"
                gap="s"
              >
                <Spinner size="s" />
                Loading tables
              </Box>
            </Combobox.Status>
          </Combobox.Viewport>
        </Combobox.Content>
      </Combobox.Root>

      <Combobox.Root items={[]}>
        <Combobox.InputGroup>
          <Combobox.Input
            aria-label="Empty tables"
            placeholder="Find a table"
          />
          <Combobox.InputTrigger />
        </Combobox.InputGroup>
        <Combobox.Content width="s">
          <Combobox.Viewport>
            <Combobox.Empty>No tables match this filter.</Combobox.Empty>
            <Combobox.List />
          </Combobox.Viewport>
        </Combobox.Content>
      </Combobox.Root>
    </Box>
  )
}
