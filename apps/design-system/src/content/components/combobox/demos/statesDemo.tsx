import { Box, Combobox, Field } from '@inspektor/ds'
import { type ReactElement } from 'react'

const branches = ['main', 'develop', 'release/v2']

function BranchOptions(): ReactElement {
  return (
    <Combobox.Content>
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
  )
}

export default function ComboboxStatesDemo(): ReactElement {
  return (
    <Box
      width="popup-width-m"
      flexDirection="column"
      gap="l"
    >
      <Field.Root name="fullWidthBranch">
        <Field.Label>Full-width branch</Field.Label>
        <Combobox.Root
          items={branches}
          defaultValue="main"
        >
          <Combobox.InputGroup width="full">
            <Combobox.Input />
            <Combobox.InputTrigger />
          </Combobox.InputGroup>
          <BranchOptions />
        </Combobox.Root>
      </Field.Root>

      <Field.Root name="generatedBranch">
        <Field.Label>Generated branch</Field.Label>
        <Combobox.Root
          items={branches}
          defaultValue="release/v2"
          readOnly
        >
          <Combobox.InputGroup width="full">
            <Combobox.Input />
            <Combobox.InputTrigger />
          </Combobox.InputGroup>
          <BranchOptions />
        </Combobox.Root>
      </Field.Root>

      <Field.Root name="unavailableBranch">
        <Field.Label>Unavailable branch</Field.Label>
        <Combobox.Root
          items={branches}
          defaultValue="develop"
          disabled
        >
          <Combobox.InputGroup width="full">
            <Combobox.Input />
            <Combobox.InputTrigger />
          </Combobox.InputGroup>
          <BranchOptions />
        </Combobox.Root>
      </Field.Root>
    </Box>
  )
}
