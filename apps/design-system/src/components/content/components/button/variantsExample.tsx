import { Button } from "@inspector/ds";
import { type ReactElement } from "react";

export default function VariantsExample(): ReactElement {
  return (
    <>
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="link">Link</Button>
    </>
  );
}
