import { Calendar } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function BasicExample(): ReactElement {
  const [value, setValue] = useState(new Date(2026, 7, 13, 12));

  return (
    <Calendar value={value} onApply={setValue}>
      <Calendar.Trigger label="Edit timestamp">{value.toLocaleString()}</Calendar.Trigger>
      <Calendar.Content />
    </Calendar>
  );
}
