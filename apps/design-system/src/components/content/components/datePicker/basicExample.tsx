import { DatePicker } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function BasicExample(): ReactElement {
  const [value, setValue] = useState(new Date(2026, 7, 13, 12));

  return (
    <DatePicker value={value} onApply={setValue}>
      <DatePicker.Trigger label="Edit timestamp">{value.toLocaleString()}</DatePicker.Trigger>
      <DatePicker.Content />
    </DatePicker>
  );
}
