import { createFileRoute } from '@tanstack/react-router'

import { ContextMenuPage } from '@/components/content/components/contextMenu/page'

export const Route = createFileRoute('/components/context-menu')({
  component: ContextMenuPage,
  head: () => ({ meta: [{ title: 'Context Menu · Inspektor Design System' }] }),
})
