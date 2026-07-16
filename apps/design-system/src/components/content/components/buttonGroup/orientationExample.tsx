import { Button, ButtonGroup } from "@inspector/ds";
import { type ReactElement } from "react";

export default function OrientationExample(): ReactElement {
  return (
    <ButtonGroup orientation="vertical" aria-label="Zoom controls">
      <Button variant="outline">Zoom in</Button>
      <Button variant="outline">Reset zoom</Button>
      <Button variant="outline">Zoom out</Button>
    </ButtonGroup>
  );
}
