import { useEffect, useRef, type PropsWithChildren } from 'react'

import { InspectorProvider } from '@app/providers/inspectorProvider'
import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import type { ResolvedTablesNavigationTarget } from '@app/routing/inspectorNavigation'

interface InspectorRuntimeBoundaryProps extends PropsWithChildren {
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
  target,
}: InspectorRuntimeBoundaryProps): React.ReactElement | null {
  const { currentBranch, currentConnectionId, currentSchemaHash, setConnectionContext } =
    useInspectorSessionContext()
  const targetIdentity = JSON.stringify([target.connectionId, target.branch, target.schemaHash])
  const appliedTargetIdentityRef = useRef<string | null>(null)
  const attemptedTargetIdentityRef = useRef<string | null>(null)
  const sessionMatchesTarget =
    currentConnectionId === target.connectionId &&
    currentBranch === target.branch &&
    currentSchemaHash === target.schemaHash
  const isTargetApplied = appliedTargetIdentityRef.current === targetIdentity
  const isContextReady = isTargetApplied || sessionMatchesTarget

  useEffect(() => {
    if (sessionMatchesTarget === true) {
      appliedTargetIdentityRef.current = targetIdentity
      return
    }
    if (isTargetApplied === false && attemptedTargetIdentityRef.current !== targetIdentity) {
      attemptedTargetIdentityRef.current = targetIdentity
      setConnectionContext(target.connectionId, target.branch, target.schemaHash)
    }
  }, [
    isTargetApplied,
    sessionMatchesTarget,
    setConnectionContext,
    target.branch,
    target.connectionId,
    target.schemaHash,
    targetIdentity,
  ])

  if (isContextReady === false) {
    return null
  }

  return <InspectorProvider initialRuntimeTarget={target}>{children}</InspectorProvider>
}
