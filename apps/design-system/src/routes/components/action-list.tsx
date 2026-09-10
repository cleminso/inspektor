import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ActionListContent from '@/content/components/actionList/page.mdx'
import { actionListItem } from '@/lib/registry'

export const Route = createFileRoute('/components/action-list')({
  component: ActionListPage,
  head: () => ({ meta: [{ title: 'Action List · Inspektor Design System' }] }),
})

function ActionListPage() {
  return (
    <ComponentPage item={actionListItem}>
      <ActionListContent />
    </ComponentPage>
  )
}
