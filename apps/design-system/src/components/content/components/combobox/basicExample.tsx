import { Combobox, Field } from '@inspector/ds'
import { type ReactElement } from 'react'

const branches = ['main', 'develop', 'feature/schema-view', 'fix/connection-state']

export default function BasicExample(): ReactElement {
  return (
    <Field.Root name="branch">
      <Field.Label>Branch</Field.Label>
      <Combobox.Root
        items={branches}
        defaultValue="develop"
      >
        <Combobox.InputGroup>
          <Combobox.Input placeholder="Find a branch" />
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
      <Field.Description>Choose one of the available application branches.</Field.Description>
    </Field.Root>
  )
}
