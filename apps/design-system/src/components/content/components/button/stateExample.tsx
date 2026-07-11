import { Button } from "@inspector/ds";
import { type ReactElement } from "react";

export default function StateExample(): ReactElement {
  return (
    <>
      <Button loading>Saving</Button>
      <Button disabled>Disabled</Button>
      <Button fullWidth>Full width</Button>
    </>
  );
}
