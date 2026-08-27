import { describe, expect, it } from 'vitest'

import { readPrefillConfig } from './prefill'

function location(search = '', hash = ''): Location {
  return { search, hash } as Location
}

describe('readPrefillConfig', () => {
  it('reads and normalizes connection values from the URL fragment', () => {
    expect(
      readPrefillConfig(
        location(
          '',
          '#name=%20Local%20app%20&serverUrl=%20https%3A%2F%2Fexample.com%20&appId=%20app-1%20&adminSecret=%20secret%20&env=%20dev%20&branch=%20feature%20',
        ),
      ),
    ).toEqual({
      name: 'Local app',
      serverUrl: 'https://example.com',
      appId: 'app-1',
      adminSecret: 'secret',
      env: 'dev',
      branch: 'feature',
    })
  })

  it('keeps explicit query values and fills missing values from the fragment', () => {
    expect(
      readPrefillConfig(
        location('?appId=query-app&branch=query-branch', '#appId=fragment-app&adminSecret=secret'),
      ),
    ).toEqual({
      name: '',
      serverUrl: 'https://v2.sync.jazz.tools/',
      appId: 'query-app',
      adminSecret: 'secret',
      env: 'dev',
      branch: 'query-branch',
    })
  })

  it('returns defaults for a partial prefill', () => {
    expect(readPrefillConfig(location('', '#appId=app-1'))).toEqual({
      name: '',
      serverUrl: 'https://v2.sync.jazz.tools/',
      appId: 'app-1',
      adminSecret: '',
      env: 'dev',
      branch: 'main',
    })
  })

  it('ignores URLs without known prefill values', () => {
    expect(readPrefillConfig(location('?unrelated=value', '#other=value'))).toBeNull()
  })
})
