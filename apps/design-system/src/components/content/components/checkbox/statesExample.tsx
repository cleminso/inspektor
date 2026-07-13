import { Checkbox } from "@inspector/ds";
import { type ReactElement } from "react";

export default function StatesExample(): ReactElement {
  return (
    <>
      <Checkbox aria-label="Unchecked" />
      <Checkbox aria-label="Checked" defaultChecked />
      <Checkbox aria-label="Indeterminate" indeterminate />
      <Checkbox aria-label="Disabled" disabled />
      <Checkbox aria-label="Small" size="s" defaultChecked />
    </>
  );
}
