import { useEffect, useRef } from 'react'

import {
  applyTableMutationLedger,
  type TableMutationExecutor,
} from '@tables/mutationLedger/applyLedger'
import {
  useTableMutationApplicationCommands,
  useTableMutationLedger,
} from '@tables/mutationLedger/provider'
import type { TableFieldsByRowId } from '@tables/tableTypes'

export function useApplyTableMutationLedger({
  executor,
  mutations,
  onAppliedUpdates,
  onSuccess,
}: {
  executor: TableMutationExecutor
  mutations: ReturnType<typeof useTableMutationLedger>
  onAppliedUpdates?: (appliedUpdateFields: TableFieldsByRowId) => void
  onSuccess?: () => void
}): () => Promise<void> {
  const application = useTableMutationApplicationCommands()
  const applyingRef = useRef(false)
  const mountedRef = useRef(false)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return async () => {
    if (
      applyingRef.current === true ||
      mutations.execution.status === 'applying' ||
      mutations.ledger.hasInvalidDraft === true ||
      mutations.ledger.entries.length === 0
    ) {
      return
    }

    applyingRef.current = true
    application.setExecution({ error: null, status: 'applying' })
    try {
      const result = await applyTableMutationLedger(mutations.ledger, executor)
      const appliedEntryIds = new Set(result.appliedEntryIds)
      const appliedUpdateFields: Record<string, ReadonlySet<string>> = {}
      for (const entry of mutations.ledger.entries) {
        if (entry.kind === 'update' && appliedEntryIds.has(entry.entryId)) {
          appliedUpdateFields[entry.rowId] = new Set(Object.keys(entry.fields))
        }
      }
      application.acknowledgeAppliedEntries(result.appliedEntryIds)
      if (result.status === 'failed') {
        application.setExecution({
          error: result.error instanceof Error ? result.error.message : String(result.error),
          status: 'failed',
        })
      } else {
        application.setExecution({ error: null, status: 'idle' })
      }
      if (mountedRef.current === false) {
        return
      }
      if (Object.keys(appliedUpdateFields).length > 0) {
        onAppliedUpdates?.(appliedUpdateFields)
      }
      if (result.status === 'failed') {
        return
      }
      onSuccess?.()
    } finally {
      applyingRef.current = false
    }
  }
}
