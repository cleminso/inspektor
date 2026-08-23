import { createFileRoute } from '@tanstack/react-router'

import { RelationValuePage } from '@/components/content/components/relationValue/page'

export const Route = createFileRoute('/components/relation-value')({
  component: RelationValuePage,
  head: () => ({ meta: [{ title: 'Relation Value · Inspector Design System' }] }),
})
