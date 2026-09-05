import type { ConnectionCredentials } from './connections'

type ConnectionField = 'serverUrl' | 'appId' | 'adminSecret'

export interface ConnectionError {
  title: string
  description: string
  field?: ConnectionField
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
