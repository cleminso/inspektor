import { useCallback, useRef } from 'react'

import {
  applyTableMutationLedger,
  type TableMutationExecutor,
} from '@tables/mutationLedger/applyLedger'
import { useTableMutationLedger } from '@tables/mutationLedger/provider'

export function useApplyTableMutationLedger({
  executor,
  onSuccess,
}: {
  executor: TableMutationExecutor
  onSuccess?: () => void
}): () => Promise<boolean | null> {
  const mutations = useTableMutationLedger()
  const applyingRef = useRef(false)

  return useCallback(async () => {
    if (
      applyingRef.current === true ||
      mutations.execution.status === 'applying' ||
      mutations.hasInvalidEditor === true ||
      mutations.ledger.entries.length === 0
    ) {
      return null
    }

    applyingRef.current = true
    mutations.setExecution({ error: null, status: 'applying' })
    try {
      await applyTableMutationLedger(mutations.ledger, executor)
      // Clear as one UI operation only after every request in the captured ledger succeeds.
      mutations.discardAll()
      mutations.setExecution({ error: null, status: 'idle' })
      onSuccess?.()
      return true
    } catch (error) {
      mutations.setExecution({
        error: error instanceof Error ? error.message : String(error),
        status: 'failed',
      })
      return false
    } finally {
      applyingRef.current = false
    }
  }, [executor, mutations, onSuccess])
}
