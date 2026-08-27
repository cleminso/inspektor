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

import {
  createInitialFormValues,
  type AddConnectionFormValues,
  type AddConnectionStep,
} from './connectionFormTypes'

interface UseAddConnectionFlowResult {
  error: ConnectionError | null
  formValues: AddConnectionFormValues
  isSubmitting: boolean
  schemaHashes: string[]
  step: AddConnectionStep
  fetchSchemas: FormEventHandler<HTMLFormElement>
  goBackToForm: () => void
  selectSchema: (schemaHash: string) => Promise<void>
  updateField: (field: keyof AddConnectionFormValues, value: string) => void
}

interface UseAddConnectionFlowOptions {
  branch: string
  connection: StoredConnection
}

/**
 * Validates and persists add or edit form input before entering the canonical connection route.
 *
 * Schema discovery here exists for inline credential feedback and explicit schema choice. It does
 * not replace route-owned connection entry: the saved profile still navigates through the parent
 * connection loader before a runtime mounts.
 */
export function useAddConnectionFlow(
  options?: UseAddConnectionFlowOptions,
): UseAddConnectionFlowResult {
  const { connections, prefill, saveConnectionWithContext, setConnectionContext } =
    useInspectorSessionContext()
  const navigate = useNavigate()
  const [step, setStep] = useState<AddConnectionStep>('form')
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
  const [schemaHashes, setSchemaHashes] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<ConnectionError | null>(null)
  const isSubmittingRef = useRef(false)

  const canSubmit =
    formValues.serverUrl.trim().length > 0 &&
    formValues.appId.trim().length > 0 &&
    formValues.adminSecret.trim().length > 0

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

    await navigate({
      to: appRoutes.tables,
      params: {
        connectionId,
      },
    })
  }

  const fetchSchemas: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (canSubmit === false || isSubmittingRef.current === true) {
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

      const schemaHashes = createSchemaCatalogue(response).map(({ hash }) => hash)
      if (schemaHashes.length === 0) {
        setError(EMPTY_SCHEMA_ERROR)
        setSchemaHashes([])
        setStep('form')
        return
      }

      if (schemaHashes.length === 1) {
        await openResolvedConnection(schemaHashes[0])
        return
      }

      setSchemaHashes(schemaHashes)
      setStep('schema')
    } catch (error) {
      setError(normalizeSchemaFetchError(error))
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const selectSchema = async (schemaHash: string) => {
    if (isSubmittingRef.current === true) {
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    try {
      await openResolvedConnection(schemaHash)
    } catch (error) {
      setError(normalizeSchemaFetchError(error))
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const goBackToForm = () => {
    setError(null)
    setStep('form')
  }

  return {
    error,
    fetchSchemas,
    formValues,
    goBackToForm,
    isSubmitting,
    schemaHashes,
    selectSchema,
    step,
    updateField,
  }
}
