import { useEffect, useRef, type PropsWithChildren, type ReactNode } from 'react'

import { InspectorProvider } from '@app/providers/inspectorProvider'
import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import type { ResolvedTablesNavigationTarget } from '@app/routing/inspectorNavigation'

interface InspectorRuntimeBoundaryProps extends PropsWithChildren {
  fallback?: ReactNode
  target: ResolvedTablesNavigationTarget
}

/**
 * Synchronizes a route-resolved target with session state before mounting the Jazz runtime.
 *
 * Route loaders and session preferences update through different mechanisms. Rendering nothing
 * while they disagree prevents a new route from observing the previous connection's runtime. A
 * rejected synchronization also stays unmounted instead of marking an attempted target as applied.
 */
export function InspectorRuntimeBoundary({
  children,
  fallback = null,
  target,
}: InspectorRuntimeBoundaryProps): React.ReactNode {
  const { currentBranch, currentConnectionId, currentSchemaHash, setConnectionContext } =
    useInspectorSessionContext()
  const targetIdentity = JSON.stringify([target.connectionId, target.branch, target.schemaHash])
  const appliedTargetIdentityRef = useRef<string | null>(null)
  const sessionMatchesTarget =
    currentConnectionId === target.connectionId &&
    currentBranch === target.branch &&
    currentSchemaHash === target.schemaHash
  const isContextReady = appliedTargetIdentityRef.current === targetIdentity || sessionMatchesTarget

  useEffect(() => {
    if (sessionMatchesTarget === true) {
      appliedTargetIdentityRef.current = targetIdentity
      return
    }
    if (
      appliedTargetIdentityRef.current !== targetIdentity &&
      setConnectionContext(target.connectionId, target.branch, target.schemaHash) === 'accepted'
    ) {
      appliedTargetIdentityRef.current = targetIdentity
    }
  }, [
    sessionMatchesTarget,
    setConnectionContext,
    target.branch,
    target.connectionId,
    target.schemaHash,
    targetIdentity,
  ])

  if (isContextReady === false) {
    return fallback
  }

  return <InspectorProvider initialRuntimeTarget={target}>{children}</InspectorProvider>
}
