import { createFileRoute } from '@tanstack/react-router'

import { JsonViewPage } from '@/components/content/components/jsonView/page'

export const Route = createFileRoute('/components/json-view')({
  component: JsonViewPage,
  head: () => ({ meta: [{ title: 'JSON View · Inspektor Design System' }] }),
})
