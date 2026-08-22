import { useCallback } from 'react'

import { toasts } from '@inspector/ds'

import { normalizeConnectionOpenError } from '@app/connections/connectionValidation'
import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'

export function useSavedConnectionOpen(): (connectionId: string) => void {
  const { openConnection } = useInspectorSessionContext()

  return useCallback(
    (connectionId: string) => {
      void openConnection(connectionId).catch((error: unknown) => {
        const normalizedError = normalizeConnectionOpenError(error)
        toasts.error(normalizedError.title, { description: normalizedError.description })
      })
    },
    [openConnection],
  )
}
