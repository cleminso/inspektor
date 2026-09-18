import type { ConnectionCredentials } from './connections'

type ConnectionField = 'serverUrl' | 'appId' | 'adminSecret'

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

export interface SchemaCatalogueDiagnostics {
  stage: 'Schema catalogue'
  server: string
  response: string
  attempts: number
  browserNetwork: 'Online' | 'Offline' | 'Unavailable'
}

export class SchemaCatalogueLoadError extends Error {
  readonly attempts: number
  readonly reason: SchemaCatalogueFailureReason
  readonly server: string
  readonly status: number | null

  constructor({
    attempts,
    reason,
    server,
    status,
  }: Omit<SchemaCatalogueLoadError, 'message' | 'name'>) {
    super('Schema catalogue request failed')
    this.name = 'SchemaCatalogueLoadError'
    this.attempts = attempts
    this.reason = reason
    this.server = server
    this.status = status
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
    if (error.reason === 'invalid-url') {
      return INVALID_SERVER_URL_ERROR
    }

    if (error.reason === 'network') {
      return {
        title: 'Jazz server connection failed',
        description:
          "Inspektor couldn't reach the Jazz server. Check your network connection and that the server is available, then reconnect.",
      }
    }

    if (error.reason === 'server') {
      return {
        title: 'Jazz server is unavailable',
        description:
          'The Jazz server could not load this app. Check the server status, then reconnect.',
      }
    }
  }

  const status = getHttpErrorStatus(error)

  if (status === 401 || status === 403) {
    return {
      title: 'The server rejected this connection',
      description: 'Check the app ID and admin secret.',
    }
  }

  if (status === 404) {
    return {
      title: "Couldn't find this Jazz app",
      description: 'Check the server URL and app ID.',
    }
  }

  if (status !== null && status >= 500) {
    return {
      title: "Couldn't load schemas",
      description: 'Check that the server is available, then try again.',
    }
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes('invalid url')) {
    return INVALID_SERVER_URL_ERROR
  }

  return {
    title: "Couldn't connect to this app",
    description: 'Check the server URL, app ID, and admin secret.',
  }
}

export function createSchemaCatalogueLoadError(
  error: unknown,
  options: { attempts: number; serverUrl: string },
): SchemaCatalogueLoadError {
  const status = getHttpErrorStatus(error)
  const reason = getSchemaCatalogueFailureReason(error, status)
  let server = 'Invalid server URL'

  try {
    server = new URL(options.serverUrl).origin
  } catch {
    // The validated connection path normally supplies a URL. Do not expose an invalid raw value.
  }

  return new SchemaCatalogueLoadError({
    attempts: options.attempts,
    reason,
    server,
    status,
  })
}

export function isSchemaCatalogueNetworkError(error: unknown): boolean {
  return error instanceof SchemaCatalogueLoadError && error.reason === 'network'
}

export function getSchemaCatalogueDiagnostics(error: unknown): SchemaCatalogueDiagnostics | null {
  if (error instanceof SchemaCatalogueLoadError === false) {
    return null
  }

  return {
    stage: 'Schema catalogue',
    server: error.server,
    response: error.status === null ? 'No response' : `HTTP ${error.status}`,
    attempts: error.attempts,
    browserNetwork:
      typeof navigator === 'undefined'
        ? 'Unavailable'
        : navigator.onLine === true
          ? 'Online'
          : 'Offline',
  }
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
