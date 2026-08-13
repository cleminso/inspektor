import { Calendar } from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { calendarItem } from "@/lib/registry";

export function CalendarPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [value, setValue] = useState(new Date(2026, 7, 13, 12));
  const preview = (
    <Calendar value={value} onApply={setValue}>
      <Calendar.Trigger label="Edit timestamp">{value.toLocaleString()}</Calendar.Trigger>
      <Calendar.Content />
    </Calendar>
  );

  return (
    <ComponentDocsPage
      title={calendarItem.title}
      description={calendarItem.description}
      source={calendarItem.source}
      preview={preview}
      sourceCode={`const [value, setValue] = useState(new Date(2026, 7, 13, 12));

return (
  <Calendar value={value} onApply={setValue}>
    <Calendar.Trigger label="Edit timestamp">
      {value.toLocaleString()}
    </Calendar.Trigger>
    <Calendar.Content />
  </Calendar>
);`}
    >
      {children}
    </ComponentDocsPage>
  );
}
