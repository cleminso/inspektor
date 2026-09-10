import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import JsonViewContent from '@/content/components/jsonView/page.mdx'
import { jsonViewItem } from '@/lib/registry'

export const Route = createFileRoute('/components/json-view')({
  component: JsonViewPage,
  head: () => ({ meta: [{ title: 'JSON View · Inspektor Design System' }] }),
})

function JsonViewPage() {
  return (
    <ComponentPage item={jsonViewItem}>
      <JsonViewContent />
    </ComponentPage>
  )
}
