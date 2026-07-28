import { Field, Input, InputGroup } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function NullableExample(): ReactElement {
  const [isNull, setIsNull] = useState(true);

  return (
    <Field.Root>
      <Field.Label>Access token</Field.Label>
      <InputGroup fullWidth>
        <Input value={isNull ? "" : "token"} disabled={isNull} readOnly />
        <InputGroup.Checkbox
          label="Set access token to NULL"
          checked={isNull}
          tooltip="Save this field as NULL. Turn off NULL to enter a value."
          onCheckedChange={setIsNull}
        >
          NULL
        </InputGroup.Checkbox>
      </InputGroup>
      <Field.Description>NULL omits a concrete value for this column.</Field.Description>
      <Field.Error />
    </Field.Root>
  );
}
