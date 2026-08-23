import { createFileRoute } from '@tanstack/react-router'

import { FieldPage } from '@/components/content/components/field/page'

export const Route = createFileRoute('/components/field')({
  component: FieldPage,
  head: () => ({
    meta: [{ title: 'Field · Inspector Design System' }],
  }),
})
