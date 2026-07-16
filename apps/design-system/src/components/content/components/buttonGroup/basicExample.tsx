import { Button, ButtonGroup, ButtonGroupText } from "@inspector/ds";
import { type ReactElement } from "react";

export default function BasicExample(): ReactElement {
  return (
    <ButtonGroup aria-label="Document actions">
      <ButtonGroupText>Document</ButtonGroupText>
      <Button variant="outline">Archive</Button>
      <Button variant="outline">Report</Button>
      <Button variant="outline">Snooze</Button>
    </ButtonGroup>
  );
}
