import { createFileRoute } from '@tanstack/react-router'

import { ConnectionsLayout } from '@onboarding/connectionsLayout'
import { ConnectionsView } from '@onboarding/view'

export const Route = createFileRoute('/conn/')({
  component: ConnectionsIndexRoute,
})

export function ConnectionsIndexRoute(): React.ReactElement {
  return (
    <ConnectionsLayout
      connectionTriggerLabel="Open connection"
      pageTitle="Connections"
    >
      <ConnectionsView />
    </ConnectionsLayout>
  )
}
