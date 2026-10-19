import { Navigate, useNavigate } from '@tanstack/react-router'
import { Box, Text } from '@inspektor/ds'

import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import {
  getSchemaCatalogueRecoveryError,
  type ConnectionError,
  type SchemaCatalogueFailureReason,
} from '@app/connections/connectionValidation'
import { appRoutes } from '@app/routing/appRoutes'

import { ConnectionFormView } from './addConnectionView'

interface EditConnectionViewProps {
  connectionId: string
  recovery?: {
    reason: SchemaCatalogueFailureReason
    returnTo?: string
  }
}

interface RecoveryPresentation {
  error: ConnectionError
  guidance: string
  summary: string
}

const recoveryPresentationByReason = {
  authorization: {
    error: getSchemaCatalogueRecoveryError('authorization'),
    summary: 'The server is reachable, but it rejected the saved admin secret.',
    guidance:
      'Local development servers may issue a new secret after restarting. Enter the current secret to reconnect.',
  },
  'invalid-url': {
    error: getSchemaCatalogueRecoveryError('invalid-url'),
    summary: 'The saved server URL is not valid.',
    guidance: 'Update the server URL to reconnect.',
  },
  network: {
    error: getSchemaCatalogueRecoveryError('network'),
    summary: "Inspektor couldn't reach the saved server on the last attempt.",
    guidance:
      'Check that it is running and that your browser can access your device or local network, then reconnect.',
  },
  'not-found': {
    error: getSchemaCatalogueRecoveryError('not-found'),
    summary: 'The server is reachable, but it could not find the saved Jazz app.',
    guidance: 'Check the Jazz app ID, then reconnect.',
  },
  server: {
    error: getSchemaCatalogueRecoveryError('server'),
    summary: 'The saved server could not load this Jazz app.',
    guidance: 'Check the server URL and server status, then reconnect.',
  },
  unknown: {
    error: getSchemaCatalogueRecoveryError('unknown'),
    summary: "Inspektor couldn't restore this saved connection.",
    guidance: 'Review the connection details, then reconnect.',
  },
} satisfies Record<SchemaCatalogueFailureReason, RecoveryPresentation>

export function EditConnectionView({
  connectionId,
  recovery,
}: EditConnectionViewProps): React.ReactElement {
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

  const isRecovering = recovery !== undefined
  const recoveryPresentation =
    recovery === undefined ? undefined : recoveryPresentationByReason[recovery.reason]
  const initialError =
    recoveryPresentation?.error.field === undefined ? undefined : recoveryPresentation.error

  return (
    <Box
      width="full"
      maxWidth="popup-width-l"
      flexDirection="column"
      gap="xl"
    >
      {isRecovering === true ? (
        <Box
          flexDirection="column"
          gap="xs"
          role={recoveryPresentation?.error.field === undefined ? 'status' : undefined}
          aria-live={recoveryPresentation?.error.field === undefined ? 'polite' : undefined}
        >
          <Text color={recoveryPresentation?.error.field === undefined ? 'error' : undefined}>
            {recoveryPresentation?.summary}
          </Text>
          <Text color="muted">{recoveryPresentation?.guidance}</Text>
        </Box>
      ) : null}
      <ConnectionFormView
        key={connection.id}
        edit={{
          branch: getConnectionPreferences(connection.id).lastBranch,
          connection,
          adminSecret:
            recovery?.reason === 'authorization'
              ? ''
              : (getConnection(connection.id)?.adminSecret ?? ''),
          initialError,
          returnTo: recovery?.returnTo,
        }}
        cancelLabel={isRecovering === true ? 'Back to connections' : undefined}
        submitLabel={isRecovering === true ? 'Reconnect' : undefined}
        submittingLabel={isRecovering === true ? null : undefined}
        onClose={() => {
          void navigate({ to: appRoutes.connections })
        }}
      />
    </Box>
  )
}
