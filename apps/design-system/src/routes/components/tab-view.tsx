import { createFileRoute } from '@tanstack/react-router'

import { TabViewPage } from '@/components/content/components/tabView/page'

export const Route = createFileRoute('/components/tab-view')({
  component: TabViewPage,
  head: () => ({
    meta: [{ title: 'Tab View · Inspector Design System' }],
  }),
})
