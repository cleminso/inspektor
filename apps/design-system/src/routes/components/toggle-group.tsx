import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ToggleGroupContent from '@/content/components/toggleGroup/page.mdx'
import { toggleGroupItem } from '@/lib/registry'

export const Route = createFileRoute('/components/toggle-group')({
  component: ToggleGroupPage,
  head: () => ({ meta: [{ title: 'Toggle Group · Inspektor Design System' }] }),
})

function ToggleGroupPage() {
  return (
    <ComponentPage item={toggleGroupItem}>
      <ToggleGroupContent />
    </ComponentPage>
  )
}
