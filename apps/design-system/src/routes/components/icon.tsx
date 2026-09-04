import { createFileRoute } from '@tanstack/react-router'

import { IconPage } from '@/components/content/components/icon/page'

export const Route = createFileRoute('/components/icon')({
  component: IconPage,
  head: () => ({ meta: [{ title: 'Icon · Inspektor Design System' }] }),
})
