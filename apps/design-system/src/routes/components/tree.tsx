import { createFileRoute } from '@tanstack/react-router'

import { TreePage } from '@/components/content/components/tree/page'

export const Route = createFileRoute('/components/tree')({
  component: TreePage,
  head: () => ({ meta: [{ title: 'Tree · Inspektor Design System' }] }),
})
