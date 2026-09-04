import { Box } from '@inspector/ds'
import { useNavigate } from '@tanstack/react-router'

import type { StoredConnection } from '@app/connections/connections'
import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import { appRoutes } from '@app/routing/appRoutes'

import { AddConnectionForm } from './addConnectionForm'
import { getPrefillKey } from './connectionFormTypes'
import { useAddConnectionFlow } from './useAddConnectionFlow'

export function AddConnectionView(): React.ReactElement {
  const { prefill } = useInspectorSessionContext()
  const navigate = useNavigate()
  const prefillKey = getPrefillKey(prefill)

  const closeView = () => {
    void navigate({ to: appRoutes.connections })
  }

  return (
    <ConnectionFormView
      key={prefillKey}
      onClose={closeView}
    />
  )
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
