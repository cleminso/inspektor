import { Calendar } from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { calendarItem } from "@/lib/registry";

export function CalendarPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [value, setValue] = useState<Date | undefined>(new Date(2026, 7, 13));
  const preview = <Calendar value={value} onValueChange={setValue} />;

  return (
    <ComponentDocsPage
      title={calendarItem.title}
      description={calendarItem.description}
      source={calendarItem.source}
      preview={preview}
      sourceCode={`const [value, setValue] = useState<Date | undefined>(new Date(2026, 7, 13));

return <Calendar value={value} onValueChange={setValue} />;`}
    >
      {children}
    </ComponentDocsPage>
  );
}
