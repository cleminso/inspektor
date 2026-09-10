import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import DatePickerContent from '@/content/components/datePicker/page.mdx'
import { datePickerItem } from '@/lib/registry'

export const Route = createFileRoute('/components/date-picker')({
  component: DatePickerPage,
  head: () => ({ meta: [{ title: 'DatePicker · Inspektor Design System' }] }),
})

function DatePickerPage() {
  return (
    <ComponentPage item={datePickerItem}>
      <DatePickerContent />
    </ComponentPage>
  )
}
