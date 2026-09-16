import { createFileRoute } from '@tanstack/react-router'

import { ConnectionsLayout } from '@onboarding/connectionsLayout'
import { EditConnectionView } from '@onboarding/editConnectionView'

export const Route = createFileRoute('/conn/edit/$connectionId')({
  head: () => ({
    meta: [{ title: 'Edit connection | Inspektor' }],
  }),
  component: EditConnectionRoute,
})

export function EditConnectionRoute(): React.ReactElement {
  const { connectionId } = Route.useParams()
  return (
    <ConnectionsLayout pageTitle="Edit connection">
      <EditConnectionView connectionId={connectionId} />
    </ConnectionsLayout>
  )
}
