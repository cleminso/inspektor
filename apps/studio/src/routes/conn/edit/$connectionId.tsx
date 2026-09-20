import { createFileRoute } from '@tanstack/react-router'

import { formatStudioDocumentTitle } from '@shared/documentTitle'
import { ConnectionsLayout } from '@onboarding/connectionsLayout'
import { EditConnectionView } from '@onboarding/editConnectionView'

export const Route = createFileRoute('/conn/edit/$connectionId')({
  head: () => ({
    meta: [{ title: formatStudioDocumentTitle('Edit connection') }],
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
