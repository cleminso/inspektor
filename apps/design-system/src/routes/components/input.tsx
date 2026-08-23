import { createFileRoute } from '@tanstack/react-router'

import { InputPage } from '@/components/content/components/input/page'

export const Route = createFileRoute('/components/input')({
  component: InputPage,
  head: () => ({
    meta: [{ title: 'Input · Inspector Design System' }],
  }),
})
