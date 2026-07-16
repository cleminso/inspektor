import { Button, ButtonGroup, ButtonGroupSeparator } from "@inspector/ds";
import { type ReactElement } from "react";

export default function CompositionExample(): ReactElement {
  return (
    <ButtonGroup aria-label="Clipboard actions">
      <Button variant="ghost">Copy</Button>
      <ButtonGroupSeparator />
      <Button variant="ghost">Paste</Button>
    </ButtonGroup>
  );
}
