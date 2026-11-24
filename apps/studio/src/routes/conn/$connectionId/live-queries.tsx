import { createFileRoute, redirect } from '@tanstack/react-router'

import { appRoutes } from '@app/routing/appRoutes'

/** Keep existing bookmarks usable without mounting the removed telemetry feature. */
export const Route = createFileRoute('/conn/$connectionId/live-queries')({
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: appRoutes.tables,
      params: { connectionId: params.connectionId },
      search: { schema: search.schema },
      replace: true,
    })
  },
})
