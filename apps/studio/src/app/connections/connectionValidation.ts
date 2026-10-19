import type { ConnectionCredentials } from './connections'

export type ConnectionField = 'serverUrl' | 'appId' | 'adminSecret'

export interface ConnectionError {
  title: string
  description: string
  field?: ConnectionField
}

export type SchemaCatalogueFailureReason =
  | 'authorization'
  | 'invalid-url'
  | 'network'
  | 'not-found'
  | 'server'
  | 'unknown'

export class SchemaCatalogueLoadError extends Error {
  readonly reason: SchemaCatalogueFailureReason

  constructor(reason: SchemaCatalogueFailureReason) {
    super('Schema catalogue request failed')
    this.name = 'SchemaCatalogueLoadError'
    this.reason = reason
  }
}

type ConnectionValidationResult =
  | { valid: true; value: ConnectionCredentials }
  | { valid: false; error: ConnectionError }

export const EMPTY_SCHEMA_ERROR: ConnectionError = {
  title: 'No published schemas available',
  description: 'This app has no published schemas.',
}

const INVALID_SERVER_URL_ERROR: ConnectionError = {
  title: 'Invalid server URL',
  description: 'Enter a valid HTTP or HTTPS URL.',
  field: 'serverUrl',
}

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

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateConnectionInput(input: ConnectionCredentials): ConnectionValidationResult {
  const serverUrl = input.serverUrl.trim()
  const appId = input.appId.trim()
  const adminSecret = input.adminSecret.trim()
  let parsedServerUrl: URL

  try {
    parsedServerUrl = new URL(serverUrl)
  } catch {
    return invalidServerUrl()
  }

  if (parsedServerUrl.protocol !== 'http:' && parsedServerUrl.protocol !== 'https:') {
    return invalidServerUrl()
  }

  if (appId.length === 0) {
    return {
      valid: false,
      error: {
        title: 'Jazz app ID required',
        description: 'Enter a Jazz app ID.',
        field: 'appId',
      },
    }
  }

  const hostname = parsedServerUrl.hostname.toLowerCase().replace(/\.$/, '')
  if (hostname === 'v2.sync.jazz.tools' && uuidPattern.test(appId) === false) {
    return {
      valid: false,
      error: {
        title: 'Invalid Jazz app ID',
        description: 'Enter the UUID from your Jazz app settings.',
        field: 'appId',
      },
    }
  }

  if (adminSecret.length === 0) {
    return {
      valid: false,
      error: {
        title: 'Admin secret required',
        description: 'Enter an admin secret.',
        field: 'adminSecret',
      },
    }
  }

  return {
    valid: true,
    value: { serverUrl, appId, adminSecret },
  }
}

export function normalizeSchemaFetchError(error: unknown): ConnectionError {
  if (error instanceof SchemaCatalogueLoadError) {
    return getSchemaCatalogueRecoveryError(error.reason)
  }

  const status = getHttpErrorStatus(error)
  return getSchemaCatalogueRecoveryError(getSchemaCatalogueFailureReason(error, status))
}

export function createSchemaCatalogueLoadError(error: unknown): SchemaCatalogueLoadError {
  const status = getHttpErrorStatus(error)
  const reason = getSchemaCatalogueFailureReason(error, status)
  return new SchemaCatalogueLoadError(reason)
}

export function isTransientSchemaFetchError(error: unknown): boolean {
  const status = getHttpErrorStatus(error)
  if (status !== null) {
    return status === 502 || status === 503 || status === 504
  }

  return isNetworkFetchError(error)
}

function getSchemaCatalogueFailureReason(
  error: unknown,
  status: number | null,
): SchemaCatalogueFailureReason {
  if (status === 401 || status === 403) return 'authorization'
  if (status === 404) return 'not-found'
  if (status !== null && status >= 500) return 'server'
  if (error instanceof TypeError && error.message.toLowerCase().includes('invalid url')) {
    return 'invalid-url'
  }
  if (isNetworkFetchError(error)) return 'network'
  return 'unknown'
}

function isNetworkFetchError(error: unknown): boolean {
  if (error instanceof TypeError === false) return false

  const message = error.message.toLowerCase()
  return [
    'failed to fetch',
    'fetch failed',
    'load failed',
    'network request failed',
    'networkerror',
  ].some((signature) => message.includes(signature))
}

function invalidServerUrl(): ConnectionValidationResult {
  return {
    valid: false,
    error: INVALID_SERVER_URL_ERROR,
  }
}

export function getHttpErrorStatus(error: unknown): number | null {
  if (error instanceof Error) {
    const statusMatch = /(?:fetch failed:|status(?: code)?)\s*(\d{3})\b/i.exec(error.message)
    if (statusMatch?.[1] !== undefined) {
      return Number(statusMatch[1])
    }
  }

  if (typeof error !== 'object' || error === null) {
    return null
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status
  }

  if (
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number'
  ) {
    return error.response.status
  }

  return null
}
