import { useEffect, type PropsWithChildren, type ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'

import { RuntimeProvider } from '@app/runtime/runtimeProvider'
import { useConnections } from '@app/connections/connectionProvider'
import { getRuntimeExecutionIdentity } from '@app/connections/connectionCredentials'
import type { ResolvedConnectionEntry } from '@app/connections/connectionEntry'

interface InspectorRuntimeBoundaryProps extends PropsWithChildren {
  fallback?: ReactNode
  target: ResolvedConnectionEntry
}

/**
 * Attaches a committed route entry to its validated execution settings.
 *
 * Preferences only record the accepted selection. A credential or execution-setting change during
 * discovery requires a new entry; it must not start a client against the old schema evidence.
 */
export function InspectorRuntimeBoundary({
  children,
  fallback = null,
  target,
}: InspectorRuntimeBoundaryProps): React.ReactNode {
  const {
    currentBranch,
    currentConnectionId,
    currentSchemaHash,
    getConnection,
    setConnectionContext,
  } = useConnections()
  const router = useRouter()
  const connection = getConnection(target.connectionId)
  const executionMatches =
    connection !== null && getRuntimeExecutionIdentity(connection) === target.executionIdentity
  const preferencesMatch =
    currentConnectionId === target.connectionId &&
    currentBranch === target.branch &&
    currentSchemaHash === target.schemaHash

  useEffect(() => {
    if (executionMatches === false) {
      void router.invalidate()
    } else if (preferencesMatch === false) {
      setConnectionContext(target.connectionId, target.branch, target.schemaHash)
    }
  }, [
    executionMatches,
    preferencesMatch,
    router,
    setConnectionContext,
    target.branch,
    target.connectionId,
    target.schemaHash,
  ])

  if (executionMatches === false || connection === null) {
    return fallback
  }

  return (
    <RuntimeProvider
      target={target}
      connection={connection}
    >
      {children}
    </RuntimeProvider>
  )
}
