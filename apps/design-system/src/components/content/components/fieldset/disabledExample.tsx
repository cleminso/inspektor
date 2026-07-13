import { Field, Fieldset, Input } from "@inspector/ds";
import { type ReactElement } from "react";

export default function DisabledExample(): ReactElement {
  return (
    <Fieldset.Root disabled>
      <Fieldset.Legend>Organization</Fieldset.Legend>
      <Field.Root name="organization">
        <Field.Label>Name</Field.Label>
        <Input defaultValue="Inspector" fullWidth />
        <Field.Description>Organization settings are locked.</Field.Description>
      </Field.Root>
    </Fieldset.Root>
  );
}
