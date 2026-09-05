import { Box } from '@inspektor/ds'
import { useNavigate } from '@tanstack/react-router'

import type { StoredConnection } from '@app/connections/connections'
import { appRoutes } from '@app/routing/appRoutes'

import { ConnectionForm } from './connectionForm'
import { useConnectionFormFlow } from './useConnectionFormFlow'

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
  const flow = useConnectionFormFlow(edit)

  return (
    <Box
      width="full"
      maxWidth="popup-width-l"
      flexDirection="column"
      gap="xl"
    >
      <ConnectionForm
        error={flow.error}
        formValues={flow.formValues}
        isSubmitting={flow.isSubmitting}
        onCancel={onClose}
        onSubmit={flow.submitConnectionForm}
        onFieldValueChange={flow.updateFieldValue}
      />
    </Box>
  )
}
