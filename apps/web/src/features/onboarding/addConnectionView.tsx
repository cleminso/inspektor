import { Box, Button, TextLink } from '@inspector/ds'
import { Link, useNavigate } from '@tanstack/react-router'

import type { StoredConnection } from '@app/connections/connections'
import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import { appRoutes } from '@app/routing/appRoutes'

import { AddConnectionForm } from './addConnectionForm'
import { getPrefillKey } from './connectionFormTypes'
import { SchemaSwitcher } from './schemaSwitcher'
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
  const isFormStep = flow.step === 'form'

  return (
    <Box
      width="full"
      maxWidth="popup-width-l"
      flexDirection="column"
      gap="xl"
    >
      <Box justifyContent="end">
        {isFormStep === true ? (
          <TextLink
            variant="caption"
            render={<Link to={appRoutes.connections} />}
          >
            Back
          </TextLink>
        ) : (
          <Button
            type="button"
            variant="link"
            size="s"
            onClick={flow.goBackToForm}
            disabled={flow.isSubmitting === true}
          >
            Back
          </Button>
        )}
      </Box>
      {isFormStep === true ? (
        // TODO: update error message UI and copywriting
        <AddConnectionForm
          error={flow.error}
          formValues={flow.formValues}
          isSubmitting={flow.isSubmitting}
          mode={edit === undefined ? 'add' : 'edit'}
          onCancel={onClose}
          onSubmit={flow.fetchSchemas}
          onUpdateField={flow.updateField}
        />
      ) : (
        <SchemaSwitcher
          appId={flow.formValues.appId}
          error={flow.error}
          isSubmitting={flow.isSubmitting}
          onCancel={onClose}
          onSelectSchema={flow.selectSchema}
          schemaHashes={flow.schemaHashes}
        />
      )}
    </Box>
  )
}
