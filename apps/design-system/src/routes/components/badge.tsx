import { createFileRoute } from '@tanstack/react-router'

import { BadgePage } from '@/components/content/components/badge/page'

export const Route = createFileRoute('/components/badge')({
  component: BadgePage,
  head: () => ({ meta: [{ title: 'Badge · Inspector Design System' }] }),
})
