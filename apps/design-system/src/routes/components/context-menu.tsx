import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ContextMenuContent from '@/content/components/contextMenu/page.mdx'
import { contextMenuItem } from '@/lib/registry'

export const Route = createFileRoute('/components/context-menu')({
  component: ContextMenuPage,
  head: () => ({ meta: [{ title: 'Context Menu · Inspektor Design System' }] }),
})

function ContextMenuPage() {
  return (
    <ComponentPage item={contextMenuItem}>
      <ContextMenuContent />
    </ComponentPage>
  )
}
