import { createFileRoute } from '@tanstack/react-router'

import { formatStudioDocumentTitle } from '@shared/documentTitle'
import type { SchemaCatalogueFailureReason } from '@app/connections/connectionValidation'
import { getCredentialSafeConnectionReturnUrl } from '@app/routing/credentialSafeUrl'
import { ConnectionsLayout } from '@onboarding/connectionsLayout'
import { EditConnectionView } from '@onboarding/editConnectionView'

interface EditConnectionSearch {
  recovery?: SchemaCatalogueFailureReason
  returnTo?: string
}

function validateEditConnectionSearch(search: Record<string, unknown>): EditConnectionSearch {
  const recovery = parseRecoveryReason(search.recovery)
  if (recovery === undefined) return {}
  return {
    recovery,
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
  }
}

function parseRecoveryReason(value: unknown): SchemaCatalogueFailureReason | undefined {
  switch (value) {
    case 'authorization':
    case 'invalid-url':
    case 'network':
    case 'not-found':
    case 'server':
    case 'unknown':
      return value
    default:
      return undefined
  }
}

export const Route = createFileRoute('/conn/edit/$connectionId')({
  validateSearch: validateEditConnectionSearch,
  head: () => ({
    meta: [{ title: formatStudioDocumentTitle('Edit connection') }],
  }),
  component: EditConnectionRoute,
})

export function EditConnectionRoute(): React.ReactElement {
  const { connectionId } = Route.useParams()
  const search = Route.useSearch()
  const recovery =
    search.recovery !== undefined
      ? {
          reason: search.recovery,
          returnTo:
            getCredentialSafeConnectionReturnUrl(search.returnTo, connectionId) ?? undefined,
        }
      : undefined
  return (
    <ConnectionsLayout
      pageTitle={recovery === undefined ? 'Edit connection' : 'Reconnect connection'}
    >
      <EditConnectionView
        connectionId={connectionId}
        recovery={recovery}
      />
    </ConnectionsLayout>
  )
}
