import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ResizablePanelContent from '@/content/components/resizablePanel/page.mdx'
import { resizablePanelItem } from '@/lib/registry'

export const Route = createFileRoute('/components/resizable-panel')({
  component: ResizablePanelPage,
  head: () => ({
    meta: [{ title: 'Resizable Panel · Inspektor Design System' }],
  }),
})

function ResizablePanelPage() {
  return (
    <ComponentPage item={resizablePanelItem}>
      <ResizablePanelContent />
    </ComponentPage>
  )
}
