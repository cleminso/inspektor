import { afterEach, describe, expect, it } from 'vitest'

import {
  getCredentialSafeConnectionReturnUrl,
  getCredentialSafeRelativeUrl,
  sanitizeCurrentCredentialUrl,
} from './credentialSafeUrl'

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('credential-safe URLs', () => {
  it('removes admin secrets from query parameters and query-like fragments', () => {
    window.history.replaceState(
      null,
      '',
      '/conn/new?appId=app-1&adminSecret=query-secret#serverUrl=https%3A%2F%2Fsync.example.com&ADMINSECRET=fragment-secret',
    )

    sanitizeCurrentCredentialUrl()

    expect(window.location.href).toContain('appId=app-1')
    expect(window.location.href).toContain('serverUrl=')
    expect(window.location.href).not.toContain('adminSecret')
    expect(window.location.href).not.toContain('ADMINSECRET')
    expect(window.location.href).not.toContain('query-secret')
    expect(window.location.href).not.toContain('fragment-secret')
  })

  it('preserves supported route state and ordinary anchors', () => {
    expect(
      getCredentialSafeRelativeUrl({
        pathname: '/conn/connection-1/tables/users',
        search: '?schema=schema-1&filter=active&adminSecret=secret',
        hash: '#rows',
      }),
    ).toBe('/conn/connection-1/tables/users?schema=schema-1&filter=active#rows')
  })

  it('removes credentials from hash routes and encoded query-like fragments', () => {
    expect(
      getCredentialSafeRelativeUrl({
        pathname: '/conn/new',
        search: '',
        hash: '#/conn/new?appId=app-1&adminSecret=route-secret',
      }),
    ).toBe('/conn/new#/conn/new?appId=app-1')
    expect(
      getCredentialSafeRelativeUrl({
        pathname: '/conn/new',
        search: '',
        hash: '#appId%3Dapp-1%26adminSecret%3Dencoded-secret',
      }),
    ).toBe('/conn/new#appId=app-1')
  })

  it('accepts only credential-safe routes for the recovering connection', () => {
    expect(
      getCredentialSafeConnectionReturnUrl(
        '/conn/connection-1/tables/people?schema=schema-1&adminSecret=secret#rows',
        'connection-1',
      ),
    ).toBe('/conn/connection-1/tables/people?schema=schema-1#rows')
    expect(
      getCredentialSafeConnectionReturnUrl('/conn/connection-2/tables', 'connection-1'),
    ).toBeNull()
    expect(
      getCredentialSafeConnectionReturnUrl('https://example.com/conn/connection-1', 'connection-1'),
    ).toBeNull()
  })
})
