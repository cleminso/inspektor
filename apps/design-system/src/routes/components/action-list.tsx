import { createFileRoute } from '@tanstack/react-router'

import { ActionListPage } from '@/components/content/components/actionList/page'

export const Route = createFileRoute('/components/action-list')({
  component: ActionListPage,
  head: () => ({ meta: [{ title: 'Action List · Inspector Design System' }] }),
})
