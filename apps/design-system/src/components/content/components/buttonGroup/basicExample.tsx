import { Button, ButtonGroup } from "@inspector/ds";
import { type ReactElement } from "react";

export default function BasicExample(): ReactElement {
  return (
    <ButtonGroup aria-label="Document actions">
      <Button variant="ghost">Archive</Button>
      <Button variant="ghost">Report</Button>
      <Button variant="ghost">Snooze</Button>
    </ButtonGroup>
  );
}
