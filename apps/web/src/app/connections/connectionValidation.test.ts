import { describe, expect, it } from 'vitest'

import {
  createSchemaCatalogueLoadError,
  getSchemaCatalogueDiagnostics,
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
  it('describes exhausted route network failures without blaming credentials', () => {
    const error = createSchemaCatalogueLoadError(new TypeError('Failed to fetch'), {
      attempts: 3,
      serverUrl: 'https://v2.sync.jazz.tools/path',
    })

    expect(normalizeSchemaFetchError(error)).toEqual({
      title: 'Jazz server connection failed',
      description:
        "Inspektor couldn't reach the Jazz server. Check your network connection and that the server is available, then reconnect.",
    })
    expect(getSchemaCatalogueDiagnostics(error)).toEqual({
      stage: 'Schema catalogue',
      server: 'https://v2.sync.jazz.tools',
      response: 'No response',
      attempts: 3,
      browserNetwork: expect.stringMatching(/^(Online|Offline|Unavailable)$/),
    })
  })

  it('keeps route diagnostics free of credentials and raw server details', () => {
    const error = createSchemaCatalogueLoadError(
      new Error('Schema hashes fetch failed: 503 - adminSecret=must-not-leak'),
      { attempts: 3, serverUrl: 'https://v2.sync.jazz.tools' },
    )
    const serialized = JSON.stringify(getSchemaCatalogueDiagnostics(error))

    expect(serialized).toContain('HTTP 503')
    expect(serialized).not.toContain('must-not-leak')
    expect(serialized).not.toContain('adminSecret')
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

  it.each([401, 403])('normalizes direct authorization status %s', (status) => {
    expect(normalizeSchemaFetchError({ status })).toEqual({
      title: 'The server rejected this connection',
      description: 'Check the app ID and admin secret.',
    })
  })

  it('normalizes missing Jazz apps', () => {
    expect(normalizeSchemaFetchError({ status: 404 })).toEqual({
      title: "Couldn't find this Jazz app",
      description: 'Check the server URL and app ID.',
    })
  })

  it('normalizes status-bearing authorization errors', () => {
    expect(
      normalizeSchemaFetchError(
        new Error('Schema hashes fetch failed: 403 Forbidden - sensitive server detail'),
      ),
    ).toEqual({
      title: 'The server rejected this connection',
      description: 'Check the app ID and admin secret.',
    })
  })

  it('normalizes status-bearing server errors', () => {
    expect(normalizeSchemaFetchError({ response: { status: 503 } })).toEqual({
      title: "Couldn't load schemas",
      description: 'Check that the server is available, then try again.',
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
        title: "Couldn't connect to this app",
        description: 'Check the server URL, app ID, and admin secret.',
      })
      expect(`${normalized.title} ${normalized.description}`).not.toContain('Failed to fetch')
    },
  )

  it('normalizes unknown errors without exposing their contents', () => {
    expect(normalizeSchemaFetchError({ adminSecret: 'must-not-leak' })).toEqual({
      title: "Couldn't connect to this app",
      description: 'Check the server URL, app ID, and admin secret.',
    })
  })
})
