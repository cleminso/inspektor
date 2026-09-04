import { useRef, useState, type FormEventHandler } from 'react'

import { useNavigate } from '@tanstack/react-router'
import { fetchSchemaHashes } from 'jazz-tools'

import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import { findConnectionByCredentials } from '@app/connections/connectionIdentity'
import {
  createConnectionFromDraft,
  getConnectionDisplayName,
  normalizeBranchName,
  normalizeEnvName,
  type StoredConnection,
} from '@app/connections/connections'
import {
  EMPTY_SCHEMA_ERROR,
  normalizeSchemaFetchError,
  validateConnectionInput,
  type ConnectionError,
} from '@app/connections/connectionValidation'
import { appRoutes } from '@app/routing/appRoutes'
import { createSchemaCatalogue } from '@app/routing/inspectorNavigation'
import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'

import { createInitialFormValues, type AddConnectionFormValues } from './connectionFormTypes'

interface UseAddConnectionFlowResult {
  error: ConnectionError | null
  formValues: AddConnectionFormValues
  isSubmitting: boolean
  fetchSchemas: FormEventHandler<HTMLFormElement>
  updateField: (field: keyof AddConnectionFormValues, value: string) => void
}

interface UseAddConnectionFlowOptions {
  branch: string
  connection: StoredConnection
}

/**
 * Validates and persists add or edit form input before entering the canonical connection route.
 *
 * Schema discovery here provides inline credential feedback and the initial schema context. The
 * saved profile still navigates through the parent connection loader before a runtime mounts.
 */
export function useAddConnectionFlow(
  options?: UseAddConnectionFlowOptions,
): UseAddConnectionFlowResult {
  const { connections, prefill, saveConnectionWithContext, setConnectionContext } =
    useInspectorSessionContext()
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState<AddConnectionFormValues>(() =>
    options === undefined
      ? createInitialFormValues(prefill)
      : {
          name: getConnectionDisplayName(options.connection),
          serverUrl: options.connection.serverUrl,
          appId: options.connection.appId,
          adminSecret: options.connection.adminSecret,
          env: options.connection.env,
          branch: options.branch,
        },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<ConnectionError | null>(null)
  const isSubmittingRef = useRef(false)

  const updateField = (field: keyof AddConnectionFormValues, value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setError((currentError) => (currentError?.field === field ? null : currentError))
  }

  const openResolvedConnection = async (schemaHash: string) => {
    const branch = normalizeBranchName(formValues.branch)
    const draft = {
      name: formValues.name,
      serverUrl: formValues.serverUrl,
      appId: formValues.appId,
      adminSecret: formValues.adminSecret,
      env: normalizeEnvName(formValues.env),
    }
    const existingConnection = findConnectionByCredentials(connections, draft)
    const opensExistingConnection =
      existingConnection !== null && existingConnection.id !== options?.connection.id
    const connectionId = opensExistingConnection
      ? existingConnection.id
      : (options?.connection.id ?? createConnectionFromDraft(draft).id)

    const result = opensExistingConnection
      ? setConnectionContext(connectionId, branch, schemaHash)
      : saveConnectionWithContext(draft, connectionId, branch, schemaHash)
    if (result === 'blocked') {
      return
    }
    if (opensExistingConnection === true) {
      void prepareJazzWasm()
    }

    await navigate({
      to: appRoutes.tables,
      params: {
        connectionId,
      },
    })
  }

  const fetchSchemas: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (isSubmittingRef.current === true) {
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      const validation = validateConnectionInput(formValues)
      if (validation.valid === false) {
        setError(validation.error)
        return
      }

      setError(null)
      let response: Awaited<ReturnType<typeof fetchSchemaHashes>>
      try {
        response = await fetchSchemaHashes(validation.value.serverUrl, {
          appId: validation.value.appId,
          adminSecret: validation.value.adminSecret,
        })
      } catch (fetchError) {
        setError(normalizeSchemaFetchError(fetchError))
        return
      }

      const schemaHash = createSchemaCatalogue(response)[0]?.hash
      if (schemaHash === undefined) {
        setError(EMPTY_SCHEMA_ERROR)
        return
      }

      await openResolvedConnection(schemaHash)
    } catch (error) {
      setError(normalizeSchemaFetchError(error))
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return {
    error,
    fetchSchemas,
    formValues,
    isSubmitting,
    updateField,
  }
}
