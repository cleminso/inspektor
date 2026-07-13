import { Button, Field, Form, Input } from "@inspector/ds";
import { type ReactElement } from "react";

export default function ServerErrorsExample(): ReactElement {
  return (
    <Form errors={{ username: "This username is unavailable." }}>
      <Field.Root name="username">
        <Field.Label>Username</Field.Label>
        <Input defaultValue="inspector" fullWidth />
        <Field.Error />
      </Field.Root>
      <Button type="submit">Continue</Button>
    </Form>
  );
}
