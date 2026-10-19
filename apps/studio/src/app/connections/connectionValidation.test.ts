import { describe, expect, it } from 'vitest'

import {
  createSchemaCatalogueLoadError,
  isTransientSchemaFetchError,
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
    ['appId', 'Jazz app ID required', 'Enter a Jazz app ID.'],
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
        title: 'Invalid Jazz app ID',
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
  it('maps exhausted route network failures to the server URL', () => {
    const error = createSchemaCatalogueLoadError(new TypeError('Failed to fetch'))

    expect(normalizeSchemaFetchError(error)).toEqual({
      title: 'Jazz server connection failed',
      description: "Inspektor couldn't reach this server.",
    })
  })

  it.each([
    [new TypeError('Failed to fetch'), true],
    [new Error('Schema hashes fetch failed: 502 Bad Gateway'), true],
    [new Error('Schema hashes fetch failed: 503 Service Unavailable'), true],
    [new Error('Schema hashes fetch failed: 504 Gateway Timeout'), true],
    [new Error('Schema hashes fetch failed: 403 Forbidden'), false],
    [new Error('Schema hashes fetch failed: 500 Internal Server Error'), false],
    [new TypeError('Invalid URL'), false],
    [new TypeError('Cannot read properties of undefined'), false],
  ])('classifies transient schema discovery failures', (error, expected) => {
    expect(isTransientSchemaFetchError(error)).toBe(expected)
  })

  it('normalizes rejected admin secrets as a field error', () => {
    expect(normalizeSchemaFetchError({ status: 401 })).toEqual({
      title: 'The server rejected this connection',
      description: 'This admin secret was rejected.',
      field: 'adminSecret',
    })
  })

  it('normalizes forbidden connections as an admin-secret field error', () => {
    expect(normalizeSchemaFetchError({ status: 403 })).toEqual({
      title: 'The server rejected this connection',
      description: 'This admin secret was rejected.',
      field: 'adminSecret',
    })
  })

  it('normalizes missing Jazz apps', () => {
    expect(normalizeSchemaFetchError({ status: 404 })).toEqual({
      title: "Couldn't find this Jazz app",
      description: 'This Jazz app could not be found on the server.',
      field: 'appId',
    })
  })

  it('normalizes status-bearing authorization errors', () => {
    expect(
      normalizeSchemaFetchError(
        new Error('Schema hashes fetch failed: 403 Forbidden - sensitive server detail'),
      ),
    ).toEqual({
      title: 'The server rejected this connection',
      description: 'This admin secret was rejected.',
      field: 'adminSecret',
    })
  })

  it('normalizes status-bearing server errors', () => {
    expect(normalizeSchemaFetchError({ response: { status: 503 } })).toEqual({
      title: 'Jazz server is unavailable',
      description: 'This server is currently unavailable.',
    })
  })

  it('normalizes classified route failures onto their repair fields', () => {
    expect(
      normalizeSchemaFetchError(createSchemaCatalogueLoadError(new TypeError('Failed to fetch'))),
    ).toEqual({
      title: 'Jazz server connection failed',
      description: "Inspektor couldn't reach this server.",
    })
  })

  it('normalizes URL construction failures separately from network failures', () => {
    expect(normalizeSchemaFetchError(new TypeError('Invalid URL'))).toEqual({
      title: 'Invalid server URL',
      description: 'Enter a valid HTTP or HTTPS URL.',
      field: 'serverUrl',
    })
  })

  it('maps opaque browser fetch failures to the server URL', () => {
    expect(normalizeSchemaFetchError(new TypeError('Failed to fetch'))).toEqual({
      title: 'Jazz server connection failed',
      description: "Inspektor couldn't reach this server.",
    })
  })

  it('keeps unclassified fetch-like errors connection-wide', () => {
    expect(normalizeSchemaFetchError(new Error('Failed to fetch'))).toEqual({
      title: "Couldn't connect to this app",
      description: 'Check the server URL, app ID, and admin secret.',
    })
  })

  it('normalizes unknown errors without exposing their contents', () => {
    expect(normalizeSchemaFetchError({ adminSecret: 'must-not-leak' })).toEqual({
      title: "Couldn't connect to this app",
      description: 'Check the server URL, app ID, and admin secret.',
    })
  })
})
