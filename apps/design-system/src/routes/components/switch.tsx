import { createFileRoute } from '@tanstack/react-router'

import { SwitchPage } from '@/components/content/components/switch/page'

export const Route = createFileRoute('/components/switch')({
  component: SwitchPage,
  head: () => ({ meta: [{ title: 'Switch · Inspector Design System' }] }),
})
