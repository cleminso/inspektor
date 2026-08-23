import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/components/page'

export const Route = createFileRoute('/')({
  component: HomePage,
})
