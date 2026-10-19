import { Box } from '@inspektor/ds'
import { useNavigate } from '@tanstack/react-router'

import type { StoredConnection } from '@app/connections/connections'
import type { ConnectionError } from '@app/connections/connectionValidation'
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
  cancelLabel?: string
  edit?: {
    branch: string
    connection: StoredConnection
    adminSecret: string
    initialError?: ConnectionError
    returnTo?: string
  }
  onClose: () => void
  submitLabel?: string
  submittingLabel?: string | null
}

export function ConnectionFormView({
  cancelLabel,
  edit,
  onClose,
  submitLabel,
  submittingLabel,
}: ConnectionFormViewProps): React.ReactElement {
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
        cancelLabel={cancelLabel}
        isSubmitting={flow.isSubmitting}
        onCancel={onClose}
        onSubmit={flow.submitConnectionForm}
        onFieldValueChange={flow.updateFieldValue}
        onCredentialRetentionChange={flow.updateCredentialRetention}
        submitLabel={submitLabel}
        submittingLabel={submittingLabel}
      />
    </Box>
  )
}
