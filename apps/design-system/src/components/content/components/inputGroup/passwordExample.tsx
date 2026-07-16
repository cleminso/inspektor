import { Input, InputGroup } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function PasswordExample(): ReactElement {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup fullWidth>
      <Input id="password-example" aria-label="Password" type={visible ? "text" : "password"} />
      <InputGroup.Action
        label={visible ? "Hide password" : "Show password"}
        controls="password-example"
        pressed={visible}
        onClick={() => {
          setVisible((currentVisible) => currentVisible === false);
        }}
      >
        {visible ? "Hide" : "Show"}
      </InputGroup.Action>
    </InputGroup>
  );
}
