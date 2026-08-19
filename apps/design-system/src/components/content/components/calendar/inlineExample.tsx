import { Calendar } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function InlineExample(): ReactElement {
  const [value, setValue] = useState(new Date(2026, 7, 13, 12));

  return (
    <Calendar value={value} onApply={setValue}>
      <Calendar.Content mode="inline" />
    </Calendar>
  );
}
