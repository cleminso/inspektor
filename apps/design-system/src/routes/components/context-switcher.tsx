import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ContextSwitcherContent from '@/content/components/contextSwitcher/page.mdx'
import { contextSwitcherItem } from '@/lib/registry'

export const Route = createFileRoute('/components/context-switcher')({
  component: ContextSwitcherPage,
  head: () => ({
    meta: [{ title: 'Context Switcher · Inspektor Design System' }],
  }),
})

function ContextSwitcherPage() {
  return (
    <ComponentPage item={contextSwitcherItem}>
      <ContextSwitcherContent />
    </ComponentPage>
  )
}
