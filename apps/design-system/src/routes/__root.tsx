import { createRootRoute } from '@tanstack/react-router'

import { NotFoundPage } from '@/components/page'
import { AppShell } from '@/layout/appShell'

export const Route = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [{ title: 'Inspektor Design System' }],
  }),
})
