import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import SidePanelContent from '@/content/components/sidePanel/page.mdx'
import { sidePanelItem } from '@/lib/registry'

export const Route = createFileRoute('/components/side-panel')({
  component: SidePanelPage,
  head: () => ({ meta: [{ title: 'Side Panel · Inspektor Design System' }] }),
})

function SidePanelPage() {
  return (
    <ComponentPage item={sidePanelItem}>
      <SidePanelContent />
    </ComponentPage>
  )
}
