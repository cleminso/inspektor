import { Combobox, Field } from "@inspector/ds";
import { type ReactElement } from "react";

const branches = ["main", "develop"];

export default function DisabledExample(): ReactElement {
  return (
    <Field.Root name="disabled-branch">
      <Field.Label>Branch</Field.Label>
      <Combobox.Root items={branches} defaultValue="main" disabled>
        <Combobox.InputGroup>
          <Combobox.Input aria-label="Branch" />
          <Combobox.Clear />
          <Combobox.InputTrigger />
        </Combobox.InputGroup>
        <Combobox.Content>
          <Combobox.List>
            {(branch: string) => (
              <Combobox.Item key={branch} value={branch}>
                {branch}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Content>
      </Combobox.Root>
      <Field.Description>Selection is unavailable for this connection.</Field.Description>
    </Field.Root>
  );
}
