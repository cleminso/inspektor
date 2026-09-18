import { createFileRoute } from '@tanstack/react-router'

import { AddConnectionView } from '@onboarding/addConnectionView'
import { ConnectionsLayout } from '@onboarding/connectionsLayout'

export const Route = createFileRoute('/conn/new')({
  head: () => ({
    meta: [{ title: 'Add connection | Inspektor' }],
  }),
  component: AddConnectionRoute,
})

export function AddConnectionRoute(): React.ReactElement {
  return (
    <ConnectionsLayout
      connectionTriggerLabel="Open connection"
      pageTitle="Add connection"
    >
      <AddConnectionView />
    </ConnectionsLayout>
  )
}
