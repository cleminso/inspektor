import { Calendar } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function BasicExample(): ReactElement {
  const [value, setValue] = useState<Date | undefined>(new Date(2026, 7, 13));

  return <Calendar value={value} onValueChange={setValue} />;
}
