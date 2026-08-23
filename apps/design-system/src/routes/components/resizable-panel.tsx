import { createFileRoute } from '@tanstack/react-router'

import { ResizablePanelPage } from '@/components/content/components/resizablePanel/page'

export const Route = createFileRoute('/components/resizable-panel')({
  component: ResizablePanelPage,
  head: () => ({
    meta: [{ title: 'Resizable Panel · Inspector Design System' }],
  }),
})
