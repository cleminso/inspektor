import { Outlet, createFileRoute } from '@tanstack/react-router'

import { InspectorLayout } from '@app/shell/layout'

export const Route = createFileRoute('/conn/$connectionId/queries')({
  head: () => ({
    meta: [{ title: 'Query subscriptions | Inspector' }],
  }),
  component: QuerySubscriptionsLayoutRoute,
})

function QuerySubscriptionsLayoutRoute(): React.ReactElement {
  return (
    <InspectorLayout pageTitle="Query subscriptions">
      <Outlet />
    </InspectorLayout>
  )
}
