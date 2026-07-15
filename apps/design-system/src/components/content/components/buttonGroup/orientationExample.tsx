import { Button, ButtonGroup } from "@inspector/ds";
import { type ReactElement } from "react";

export default function OrientationExample(): ReactElement {
  return (
    <ButtonGroup orientation="vertical" aria-label="Zoom controls">
      <Button variant="ghost">Zoom in</Button>
      <Button variant="ghost">Reset zoom</Button>
      <Button variant="ghost">Zoom out</Button>
    </ButtonGroup>
  );
}
