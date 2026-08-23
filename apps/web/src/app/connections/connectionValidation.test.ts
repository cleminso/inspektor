import { describe, expect, it } from 'vitest'

import {
  ConnectionNavigationError,
  NoStoredSchemasError,
  normalizeConnectionOpenError,
  normalizeSchemaFetchError,
  validateConnectionInput,
} from './connectionValidation'

const validInput = {
  serverUrl: 'https://self-hosted.example.com',
  appId: 'my-arbitrary-app-id',
  adminSecret: 'arbitrary secret value',
}

describe('validateConnectionInput', () => {
  it.each([
    ['appId', 'App ID required', 'Enter an app ID.'],
    ['adminSecret', 'Admin secret required', 'Enter an admin secret.'],
  ] as const)('requires %s', (field, title, description) => {
    expect(validateConnectionInput({ ...validInput, [field]: '   ' })).toEqual({
      valid: false,
      error: { title, description, field },
    })
  })

  it('returns trimmed connection values', () => {
    expect(
      validateConnectionInput({
        serverUrl: '  https://self-hosted.example.com  ',
        appId: '  app-id  ',
        adminSecret: '  secret  ',
      }),
    ).toEqual({
      valid: true,
      value: {
        serverUrl: 'https://self-hosted.example.com',
        appId: 'app-id',
        adminSecret: 'secret',
      },
    })
  })

  it.each(['not a url', 'ftp://example.com', 'ws://example.com'])(
    'rejects the invalid server URL %s',
    (serverUrl) => {
      expect(validateConnectionInput({ ...validInput, serverUrl })).toEqual({
        valid: false,
        error: {
          title: 'Invalid server URL',
          description: 'Enter a valid HTTP or HTTPS URL.',
          field: 'serverUrl',
        },
      })
    },
  )

  it('requires UUID-shaped app IDs for Jazz Cloud', () => {
    expect(
      validateConnectionInput({
        ...validInput,
        serverUrl: 'https://v2.sync.jazz.tools/',
      }),
    ).toEqual({
      valid: false,
      error: {
        title: 'Invalid app ID',
        description: 'Enter the UUID from your Jazz app settings.',
        field: 'appId',
      },
    })
  })

  it('requires UUID-shaped app IDs for a Jazz Cloud hostname with a terminal dot', () => {
    expect(
      validateConnectionInput({
        ...validInput,
        serverUrl: 'https://v2.sync.jazz.tools./',
      }),
    ).toMatchObject({
      valid: false,
      error: { field: 'appId' },
    })
  })

  it('accepts UUID-shaped Jazz Cloud app IDs', () => {
    expect(
      validateConnectionInput({
        ...validInput,
        serverUrl: 'https://v2.sync.jazz.tools/',
        appId: '123e4567-e89b-12d3-a456-426614174000',
      }),
    ).toMatchObject({ valid: true })
  })

  it('allows non-UUID app IDs and arbitrary non-empty secrets for self-hosted servers', () => {
    expect(validateConnectionInput(validInput)).toEqual({
      valid: true,
      value: validInput,
    })
  })
})

describe('normalizeSchemaFetchError', () => {
  it.each([401, 403])('normalizes direct authorization status %s', (status) => {
    expect(normalizeSchemaFetchError({ status })).toEqual({
      title: 'Connection was rejected',
      description: 'Check the app ID and admin secret.',
    })
  })

  it('normalizes missing Jazz apps', () => {
    expect(normalizeSchemaFetchError({ status: 404 })).toEqual({
      title: 'Jazz app not found',
      description: 'Check the server URL and app ID.',
    })
  })

  it('normalizes status-bearing authorization errors', () => {
    expect(
      normalizeSchemaFetchError(
        new Error('Schema hashes fetch failed: 403 Forbidden - sensitive server detail'),
      ),
    ).toEqual({
      title: 'Connection was rejected',
      description: 'Check the app ID and admin secret.',
    })
  })

  it('normalizes status-bearing server errors', () => {
    expect(normalizeSchemaFetchError({ response: { status: 503 } })).toEqual({
      title: 'Schema service unavailable',
      description: 'Check the server status.',
    })
  })

  it('normalizes a saved connection without stored schemas', () => {
    expect(normalizeSchemaFetchError(new NoStoredSchemasError())).toEqual({
      title: 'No stored schemas found',
      description: 'This app has no published schema.',
    })
  })

  it('normalizes URL construction failures separately from network failures', () => {
    expect(normalizeSchemaFetchError(new TypeError('Invalid URL'))).toEqual({
      title: 'Invalid server URL',
      description: 'Enter a valid HTTP or HTTPS URL.',
      field: 'serverUrl',
    })
  })

  it.each([new TypeError('Failed to fetch'), new Error('Failed to fetch')])(
    'normalizes opaque fetch failures without claiming a network cause',
    (error) => {
      const normalized = normalizeSchemaFetchError(error)

      expect(normalized).toEqual({
        title: "Couldn't validate this connection",
        description: 'Check the server URL, app ID, and admin secret.',
      })
      expect(`${normalized.title} ${normalized.description}`).not.toContain('Failed to fetch')
    },
  )

  it('normalizes unknown errors without exposing their contents', () => {
    expect(normalizeSchemaFetchError({ adminSecret: 'must-not-leak' })).toEqual({
      title: "Couldn't validate this connection",
      description: 'Check the server URL, app ID, and admin secret.',
    })
  })
})

describe('normalizeConnectionOpenError', () => {
  it('distinguishes navigation failures from connection validation failures', () => {
    expect(normalizeConnectionOpenError(new ConnectionNavigationError())).toEqual({
      title: "Couldn't open this connection",
      description: 'Try again.',
    })
  })
})
