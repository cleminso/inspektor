import { createFileRoute } from '@tanstack/react-router'

import { EditConnectionView } from '@onboarding/editConnectionView'

export const Route = createFileRoute('/conn/edit/$connectionId')({
  head: () => ({
    meta: [{ title: 'Edit connection | Inspektor' }],
  }),
  component: EditConnectionRoute,
})

function EditConnectionRoute(): React.ReactElement {
  const { connectionId } = Route.useParams()
  return <EditConnectionView connectionId={connectionId} />
}
