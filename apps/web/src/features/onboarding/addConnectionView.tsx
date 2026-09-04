import { Box } from '@inspektor/ds'
import { useNavigate } from '@tanstack/react-router'

import type { StoredConnection } from '@app/connections/connections'
import { appRoutes } from '@app/routing/appRoutes'

import { AddConnectionForm } from './addConnectionForm'
import { useAddConnectionFlow } from './useAddConnectionFlow'

export function AddConnectionView(): React.ReactElement {
  const navigate = useNavigate()

  const closeView = () => {
    void navigate({ to: appRoutes.connections })
  }

  return <ConnectionFormView onClose={closeView} />
}

interface ConnectionFormViewProps {
  edit?: {
    branch: string
    connection: StoredConnection
  }
  onClose: () => void
}

export function ConnectionFormView({ edit, onClose }: ConnectionFormViewProps): React.ReactElement {
  const flow = useAddConnectionFlow(edit)

  return (
    <Box
      width="full"
      maxWidth="popup-width-l"
      flexDirection="column"
      gap="xl"
    >
      {/* TODO: update error message UI and copywriting */}
      <AddConnectionForm
        error={flow.error}
        formValues={flow.formValues}
        isSubmitting={flow.isSubmitting}
        mode={edit === undefined ? 'add' : 'edit'}
        onCancel={onClose}
        onSubmit={flow.fetchSchemas}
        onUpdateField={flow.updateField}
      />
    </Box>
  )
}
