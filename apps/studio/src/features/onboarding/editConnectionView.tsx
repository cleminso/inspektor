import { Navigate, useNavigate } from '@tanstack/react-router'

import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import { appRoutes } from '@app/routing/appRoutes'

import { ConnectionFormView } from './addConnectionView'

interface EditConnectionViewProps {
  connectionId: string
}

export function EditConnectionView({ connectionId }: EditConnectionViewProps): React.ReactElement {
  const { connections, getConnection, getConnectionPreferences } = useInspectorSessionContext()
  const navigate = useNavigate()
  const connection = connections.find((item) => item.id === connectionId)

  if (connection === undefined) {
    return (
      <Navigate
        to={appRoutes.connections}
        replace
      />
    )
  }

  return (
    <ConnectionFormView
      key={connection.id}
      edit={{
        branch: getConnectionPreferences(connection.id).lastBranch,
        connection,
        adminSecret: getConnection(connection.id)?.adminSecret ?? '',
      }}
      onClose={() => {
        void navigate({ to: appRoutes.connections })
      }}
    />
  )
}
