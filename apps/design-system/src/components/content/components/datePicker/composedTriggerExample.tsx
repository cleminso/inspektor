import { Button, DatePicker } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function ComposedTriggerExample(): ReactElement {
  const [value, setValue] = useState<Date>();

  return (
    <DatePicker value={value} onApply={setValue}>
      <DatePicker.Trigger label="Edit cell timestamp" render={<Button variant="secondary" />}>
        {value === undefined ? "Empty cell" : value.toLocaleString()}
      </DatePicker.Trigger>
      <DatePicker.Content align="center" />
    </DatePicker>
  );
}
