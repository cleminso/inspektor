import { Button, Calendar } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function ComposedTriggerExample(): ReactElement {
  const [value, setValue] = useState<Date>();

  return (
    <Calendar value={value} onApply={setValue}>
      <Calendar.Trigger label="Edit cell timestamp" render={<Button variant="secondary" />}>
        {value === undefined ? "Empty cell" : value.toLocaleString()}
      </Calendar.Trigger>
      <Calendar.Content align="center" />
    </Calendar>
  );
}
