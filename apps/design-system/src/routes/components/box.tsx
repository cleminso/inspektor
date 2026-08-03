import { createFileRoute } from '@tanstack/react-router'

import { BoxPage } from '@/components/content/components/box/page'

export const Route = createFileRoute('/components/box')({
  component: BoxPage,
  head: () => ({ meta: [{ title: 'Box · Inspector Design System' }] }),
})
