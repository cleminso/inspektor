import { Button, Field, Form, Input, Text } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function BasicExample(): ReactElement {
  const [submittedEmail, setSubmittedEmail] = useState<string>();

  return (
    <Form<{ email: string }>
      onFormSubmit={(values) => {
        setSubmittedEmail(values.email);
      }}
    >
      <Field.Root name="email">
        <Field.Label>Email</Field.Label>
        <Input type="email" required placeholder="name@example.com" fullWidth />
        <Field.Error match="valueMissing">Enter an email address.</Field.Error>
      </Field.Root>
      <Button type="submit">Submit</Button>
      {submittedEmail === undefined ? null : (
        <Text color="muted">Submitted {submittedEmail}</Text>
      )}
    </Form>
  );
}
