import { Checkbox, Field } from "@inspector/ds";
import { type ReactElement } from "react";

export default function BasicExample(): ReactElement {
  return (
    <Field.Root name="notifications">
      <Field.Label>
        <Checkbox defaultChecked />
        Enable notifications
      </Field.Label>
    </Field.Root>
  );
}
