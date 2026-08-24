import { createFileRoute, redirect } from '@tanstack/react-router'

import { appRoutes } from '@app/routing/appRoutes'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: appRoutes.connections })
  },
})
