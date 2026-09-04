import { createFileRoute } from '@tanstack/react-router'

import { SpinnerPage } from '@/components/content/components/spinner/page'

export const Route = createFileRoute('/components/spinner')({
  component: SpinnerPage,
  head: () => ({ meta: [{ title: 'Spinner · Inspektor Design System' }] }),
})
