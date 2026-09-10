import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import StructuredValuePreviewContent from '@/content/components/structuredValuePreview/page.mdx'
import { structuredValuePreviewItem } from '@/lib/registry'

export const Route = createFileRoute('/components/structured-value-preview')({
  component: StructuredValuePreviewPage,
  head: () => ({ meta: [{ title: 'Structured Value Preview · Inspektor Design System' }] }),
})

function StructuredValuePreviewPage() {
  return (
    <ComponentPage item={structuredValuePreviewItem}>
      <StructuredValuePreviewContent />
    </ComponentPage>
  )
}
