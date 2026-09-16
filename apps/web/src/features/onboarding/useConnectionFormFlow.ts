import { useRef, useState, type FormEventHandler } from 'react'

import { useNavigate } from '@tanstack/react-router'

import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import { findConnectionByCredentials } from '@app/connections/connectionIdentity'
import {
  createConnectionFromDraft,
  DEFAULT_BRANCH_NAME,
  DEFAULT_SERVER_URL,
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
import {
  fetchConnectionSchemaCatalogue,
  handoffStoredRuntimeTarget,
} from '@app/routing/inspectorNavigation'
import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'

import type { ConnectionFormValues } from './connectionFormTypes'

interface UseConnectionFormFlowResult {
  error: ConnectionError | null
  formValues: ConnectionFormValues
  isSubmitting: boolean
  submitConnectionForm: FormEventHandler<HTMLFormElement>
  updateFieldValue: (field: keyof ConnectionFormValues, value: string) => void
}

interface UseConnectionFormFlowOptions {
  branch: string
  connection: StoredConnection
}

/**
 * Validates and persists add or edit form input before entering the canonical connection route.
 *
 * Schema discovery here provides inline credential feedback and the initial schema context. The
 * saved profile still navigates through the parent connection loader before a runtime mounts.
 */
export function useConnectionFormFlow(
  options?: UseConnectionFormFlowOptions,
): UseConnectionFormFlowResult {
  const { connections, saveConnectionWithContext, setConnectionContext } =
    useInspectorSessionContext()
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState<ConnectionFormValues>(() =>
    options === undefined
      ? {
          name: '',
          serverUrl: DEFAULT_SERVER_URL,
          appId: '',
          adminSecret: '',
          env: 'dev',
          branch: DEFAULT_BRANCH_NAME,
        }
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

  const updateFieldValue = (field: keyof ConnectionFormValues, value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setError((currentError) => (currentError?.field === field ? null : currentError))
  }

  const openResolvedConnection = async (
    schemaHash: string,
    schemaCatalogue: Awaited<ReturnType<typeof fetchConnectionSchemaCatalogue>>,
  ) => {
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
    handoffStoredRuntimeTarget(draft, { branch, connectionId, schemaCatalogue, schemaHash })

    await navigate({
      to: appRoutes.tables,
      params: {
        connectionId,
      },
    })
  }

  const submitConnectionForm: FormEventHandler<HTMLFormElement> = async (event) => {
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
      void prepareJazzWasm()
      let schemaCatalogue: Awaited<ReturnType<typeof fetchConnectionSchemaCatalogue>>
      try {
        schemaCatalogue = await fetchConnectionSchemaCatalogue({
          serverUrl: validation.value.serverUrl,
          appId: validation.value.appId,
          adminSecret: validation.value.adminSecret,
        })
      } catch (fetchError) {
        setError(normalizeSchemaFetchError(fetchError))
        return
      }

      const schemaHash = schemaCatalogue[0]?.hash
      if (schemaHash === undefined) {
        setError(EMPTY_SCHEMA_ERROR)
        return
      }

      await openResolvedConnection(schemaHash, schemaCatalogue)
    } catch (error) {
      setError(normalizeSchemaFetchError(error))
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return {
    error,
    submitConnectionForm,
    formValues,
    isSubmitting,
    updateFieldValue,
  }
}
