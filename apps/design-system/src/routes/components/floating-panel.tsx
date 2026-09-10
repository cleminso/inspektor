import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import FloatingPanelContent from '@/content/components/floatingPanel/page.mdx'
import { floatingPanelItem } from '@/lib/registry'

export const Route = createFileRoute('/components/floating-panel')({
  component: FloatingPanelPage,
  head: () => ({ meta: [{ title: 'Floating Panel · Inspektor Design System' }] }),
})

function FloatingPanelPage() {
  return (
    <ComponentPage item={floatingPanelItem}>
      <FloatingPanelContent />
    </ComponentPage>
  )
}
