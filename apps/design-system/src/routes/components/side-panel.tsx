import { createFileRoute } from '@tanstack/react-router'

import { SidePanelPage } from '@/components/content/components/sidePanel/page'

export const Route = createFileRoute('/components/side-panel')({
  component: SidePanelPage,
  head: () => ({ meta: [{ title: 'Side Panel · Inspektor Design System' }] }),
})
