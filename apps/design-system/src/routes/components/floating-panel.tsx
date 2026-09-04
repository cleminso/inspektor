import { createFileRoute } from '@tanstack/react-router'

import { FloatingPanelPage } from '@/components/content/components/floatingPanel/page'

export const Route = createFileRoute('/components/floating-panel')({
  component: FloatingPanelPage,
  head: () => ({ meta: [{ title: 'Floating Panel · Inspektor Design System' }] }),
})
