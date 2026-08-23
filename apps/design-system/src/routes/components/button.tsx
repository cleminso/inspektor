import { createFileRoute } from '@tanstack/react-router'

import { ButtonPage } from '@/components/content/components/button/page'

export const Route = createFileRoute('/components/button')({
  component: ButtonPage,
  head: () => ({
    meta: [{ title: 'Button · Inspector Design System' }],
  }),
})
