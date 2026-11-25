import {
  createSchemaCatalogueLoadError,
  validateConnectionCredentials,
  type ConnectionCredentials,
  type InvalidConnectionReason,
  type SchemaCatalogueFailureReason,
} from '@inspektor/core/connection'

export {
  SchemaCatalogueLoadError,
  createSchemaCatalogueLoadError,
  isTransientSchemaFetchError,
  getHttpErrorStatus,
  type SchemaCatalogueFailureReason,
} from '@inspektor/core/connection'

export type ConnectionField = 'serverUrl' | 'appId' | 'adminSecret'
export interface ConnectionError {
  title: string
  description: string
  field?: ConnectionField
}

export const EMPTY_SCHEMA_ERROR: ConnectionError = {
  title: 'No published schemas available',
  description: 'This app has no published schemas.',
}
const INVALID_SERVER_URL_ERROR: ConnectionError = {
  title: 'Invalid server URL',
  description: 'Enter a valid HTTP or HTTPS URL.',
  field: 'serverUrl',
}
const INPUT_ERRORS = {
  'invalid-url': INVALID_SERVER_URL_ERROR,
  'missing-app-id': {
    title: 'Jazz app ID required',
    description: 'Enter a Jazz app ID.',
    field: 'appId',
  },
  'invalid-app-id': {
    title: 'Invalid Jazz app ID',
    description: 'Enter the UUID from your Jazz app settings.',
    field: 'appId',
  },
  'missing-secret': {
    title: 'Admin secret required',
    description: 'Enter an admin secret.',
    field: 'adminSecret',
  },
} satisfies Record<InvalidConnectionReason, ConnectionError>

const SCHEMA_CATALOGUE_RECOVERY_ERRORS = {
  authorization: {
    title: 'The server rejected this connection',
    description: 'This admin secret was rejected.',
    field: 'adminSecret',
  },
  'invalid-url': INVALID_SERVER_URL_ERROR,
  network: {
    title: 'Jazz server connection failed',
    description: "Inspektor couldn't reach this server.",
  },
  'not-found': {
    title: "Couldn't find this Jazz app",
    description: 'This Jazz app could not be found on the server.',
    field: 'appId',
  },
  server: {
    title: 'Jazz server is unavailable',
    description: 'This server is currently unavailable.',
  },
  unknown: {
    title: "Couldn't connect to this app",
    description: 'Check the server URL, app ID, and admin secret.',
  },
} satisfies Record<SchemaCatalogueFailureReason, ConnectionError>

export function getSchemaCatalogueRecoveryError(
  reason: SchemaCatalogueFailureReason,
): ConnectionError {
  return SCHEMA_CATALOGUE_RECOVERY_ERRORS[reason]
}

export function validateConnectionInput(
  input: ConnectionCredentials,
): { valid: true; value: ConnectionCredentials } | { valid: false; error: ConnectionError } {
  const result = validateConnectionCredentials(input)
  return result.valid === true ? result : { valid: false, error: INPUT_ERRORS[result.reason] }
}

export function normalizeSchemaFetchError(error: unknown): ConnectionError {
  return getSchemaCatalogueRecoveryError(createSchemaCatalogueLoadError(error).reason)
}
