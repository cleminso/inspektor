import { TextField } from "@inspector/ds";
import { type ReactElement } from "react";

export default function ErrorExample(): ReactElement {
  return (
    // The composed Input is internal; consumers configure it through TextField props.
    <TextField
      name="username"
      label="Username"
      defaultValue="admin"
      error="This username is unavailable."
    />
  );
}
