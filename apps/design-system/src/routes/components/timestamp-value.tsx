import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import TimestampValueContent from '@/content/components/timestampValue/page.mdx'
import { timestampValueItem } from '@/lib/registry'

export const Route = createFileRoute('/components/timestamp-value')({
  component: TimestampValuePage,
  head: () => ({ meta: [{ title: 'Timestamp Value · Inspektor Design System' }] }),
})

function TimestampValuePage() {
  return (
    <ComponentPage item={timestampValueItem}>
      <TimestampValueContent />
    </ComponentPage>
  )
}
