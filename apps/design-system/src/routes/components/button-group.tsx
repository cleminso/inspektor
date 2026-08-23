import { createFileRoute } from '@tanstack/react-router'

import { ButtonGroupPage } from '@/components/content/components/buttonGroup/page'

export const Route = createFileRoute('/components/button-group')({
  component: ButtonGroupPage,
  head: () => ({
    meta: [{ title: 'Button Group · Inspector Design System' }],
  }),
})
