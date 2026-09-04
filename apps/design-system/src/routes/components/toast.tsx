import { createFileRoute } from '@tanstack/react-router'

import { ToastPage } from '@/components/content/components/toast/page'

export const Route = createFileRoute('/components/toast')({
  component: ToastPage,
  head: () => ({ meta: [{ title: 'Toast · Inspektor Design System' }] }),
})
