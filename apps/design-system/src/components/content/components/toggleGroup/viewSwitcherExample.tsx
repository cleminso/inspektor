import { ToggleGroup } from "@inspector/ds";
import { type ReactElement, useState } from "react";

const defaultValue = ["tables"];

export default function ViewSwitcherExample(): ReactElement {
  const [value, setValue] = useState(defaultValue);

  const handleValueChange = (nextValue: string[]) => {
    if (nextValue.length > 0) {
      setValue(nextValue);
    }
  };

  return (
    <ToggleGroup value={value} onValueChange={handleValueChange} aria-label="Data view">
      <ToggleGroup.Item value="tables">Tables</ToggleGroup.Item>
      <ToggleGroup.Item value="subscriptions">Subscriptions</ToggleGroup.Item>
    </ToggleGroup>
  );
}
