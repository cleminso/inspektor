import { createRootRoute } from '@tanstack/react-router'

import { AppShell } from '@/layout/appShell'
import { NotFoundPage } from '@/components/page'

export const Route = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [{ title: 'Inspector Design System' }],
  }),
})
