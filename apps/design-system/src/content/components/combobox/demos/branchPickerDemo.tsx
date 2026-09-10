import { Box, Combobox, Field } from '@inspektor/ds'
import { type ReactElement } from 'react'

const branches = ['main', 'develop', 'feature/schema-view', 'fix/connection-state', 'release/v2']

export default function BranchPickerDemo(): ReactElement {
  return (
    <Box width="popup-width-m">
      <Field.Root name="branch">
        <Field.Label>Branch</Field.Label>
        <Combobox.Root
          items={branches}
          defaultValue="develop"
        >
          <Combobox.InputGroup width="full">
            <Combobox.Input placeholder="Find a branch" />
            <Combobox.Clear label="Clear branch" />
            <Combobox.InputTrigger />
          </Combobox.InputGroup>
          <Combobox.Content>
            <Combobox.Viewport>
              <Combobox.Empty>No branches found.</Combobox.Empty>
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
      </Field.Root>
    </Box>
  )
}
