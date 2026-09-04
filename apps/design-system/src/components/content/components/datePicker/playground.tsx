import { DatePicker } from '@inspektor/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { datePickerItem } from '@/lib/registry'

export function DatePickerPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [value, setValue] = useState(new Date(2026, 7, 13, 12))
  const preview = (
    <DatePicker
      value={value}
      onApply={setValue}
    >
      <DatePicker.Trigger label="Edit timestamp">{value.toLocaleString()}</DatePicker.Trigger>
      <DatePicker.Content />
    </DatePicker>
  )

  return (
    <ComponentDocsPage
      title={datePickerItem.title}
      description={datePickerItem.description}
      source={datePickerItem.source}
      preview={preview}
      sourceCode={`const [value, setValue] = useState(new Date(2026, 7, 13, 12));

return (
  <DatePicker value={value} onApply={setValue}>
    <DatePicker.Trigger label="Edit timestamp">
      {value.toLocaleString()}
    </DatePicker.Trigger>
    <DatePicker.Content />
  </DatePicker>
);`}
    >
      {children}
    </ComponentDocsPage>
  )
}
