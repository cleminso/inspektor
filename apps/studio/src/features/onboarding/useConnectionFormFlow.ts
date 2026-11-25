import { useRef, useState, type FormEventHandler } from 'react'

import { useNavigate } from '@tanstack/react-router'
import { Effect } from 'effect'
import {
  EmptySchemaCatalogueError,
  discoverConnection,
  planConnectionOpening,
  type SchemaCatalogueRecord,
} from '@inspektor/core/workbench/connection'
import { JazzMetadata } from '@inspektor/core/jazz/schema'

import { useConnections } from '@app/connections/connectionProvider'
import {
  createConnectionFromDraft,
  DEFAULT_BRANCH_NAME,
  DEFAULT_SERVER_URL,
  getConnectionDisplayName,
  type StoredConnection,
} from '@app/connections/connections'
import {
  EMPTY_SCHEMA_ERROR,
  normalizeSchemaFetchError,
  validateConnectionInput,
  type ConnectionError,
} from '@app/connections/connectionValidation'
import { appRoutes } from '@app/routing/appRoutes'
import { handoffStoredRuntimeTarget } from '@app/connections/connectionEntry'
import { prepareJazzWasm } from '@app/runtime/jazzWasmPreparation'

import type { ConnectionFormValues } from './connectionFormTypes'

interface UseConnectionFormFlowResult {
  error: ConnectionError | null
  formValues: ConnectionFormValues
  isSubmitting: boolean
  submitConnectionForm: FormEventHandler<HTMLFormElement>
  updateFieldValue: (
    field: Exclude<keyof ConnectionFormValues, 'credentialRetention'>,
    value: string,
  ) => void
  updateCredentialRetention: (
    credentialRetention: ConnectionFormValues['credentialRetention'],
  ) => void
}

interface UseConnectionFormFlowOptions {
  branch: string
  connection: StoredConnection
  adminSecret: string
  initialError?: ConnectionError
  returnTo?: string
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
  const { findConnectionByCredentials, saveConnectionWithContext, setConnectionContext } =
    useConnections()
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
          credentialRetention: 'memory',
        }
      : {
          name: getConnectionDisplayName(options.connection),
          serverUrl: options.connection.serverUrl,
          appId: options.connection.appId,
          adminSecret: options.adminSecret,
          env: options.connection.env,
          branch: options.branch,
          credentialRetention: options.connection.credentialRetention,
        },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<ConnectionError | null>(options?.initialError ?? null)
  const isSubmittingRef = useRef(false)

  const updateFieldValue = (
    field: Exclude<keyof ConnectionFormValues, 'credentialRetention'>,
    value: string,
  ) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setError((currentError) => (currentError?.field === field ? null : currentError))
  }

  const updateCredentialRetention = (
    credentialRetention: ConnectionFormValues['credentialRetention'],
  ) => {
    setFormValues((currentValues) => ({ ...currentValues, credentialRetention }))
  }

  const openResolvedConnection = async (
    schemaHash: string,
    schemaCatalogue: readonly SchemaCatalogueRecord[],
  ) => {
    const draft = {
      name: formValues.name,
      serverUrl: formValues.serverUrl,
      appId: formValues.appId,
      adminSecret: formValues.adminSecret,
      env: formValues.env,
      credentialRetention: formValues.credentialRetention,
    }
    const plan = planConnectionOpening({
      draft,
      branch: formValues.branch,
      schemaHash,
      schemaCatalogue,
      existingConnection: findConnectionByCredentials(draft),
      editingConnectionId: options?.connection.id,
      createConnectionId: () => createConnectionFromDraft(draft).id,
    })
    const { connectionId, branch } = plan.target
    const result =
      plan.action === 'activate-existing'
        ? setConnectionContext(connectionId, branch, schemaHash)
        : saveConnectionWithContext(plan.draft, connectionId, branch, schemaHash)
    if (result === 'blocked') {
      return
    }
    handoffStoredRuntimeTarget(plan.draft, plan.target)

    if (options?.returnTo !== undefined && connectionId === options.connection.id) {
      await navigate({ href: options.returnTo })
    } else {
      await navigate({
        to: appRoutes.tables,
        params: {
          connectionId,
        },
      })
    }
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
      const discovery = await Effect.runPromise(
        discoverConnection(validation.value).pipe(
          Effect.provide(JazzMetadata.layer),
          Effect.result,
        ),
      )
      if (discovery._tag === 'Failure') {
        const failure = discovery.failure
        setError(
          failure instanceof EmptySchemaCatalogueError
            ? EMPTY_SCHEMA_ERROR
            : normalizeSchemaFetchError(failure),
        )
        return
      }
      await openResolvedConnection(discovery.success.schemaHash, discovery.success.schemaCatalogue)
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
    updateCredentialRetention,
  }
}
